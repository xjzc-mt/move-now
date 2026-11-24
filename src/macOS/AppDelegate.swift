import Cocoa
import Carbon
import WebKit
import IOKit.pwr_mgt

private var gHotKeyAppDelegate: AppDelegate?

private func moveNowHotKeyHandler(
    nextHandler: EventHandlerCallRef?,
    theEvent: EventRef?,
    userData: UnsafeMutableRawPointer?
) -> OSStatus {
    Task { @MainActor in
        gHotKeyAppDelegate?.triggerRestShortcut()
    }
    return noErr
}

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate, WebBridgeDelegate {
    private var statusItem: NSStatusItem!
    private var popover: NSPopover!
    private var popoverHost: WebViewHost?

    private var welcomeWindow: NSWindow?
    private var welcomeHost: WebViewHost?

    private var prefsWindow: NSWindow?
    private var prefsHost: WebViewHost?

    private var activityMonitor: ActivityMonitor!
    private var engineHost: EngineHost!
    private var overlayController: OverlayController!
    private var tickTimer: DispatchSourceTimer?
    private var hotKeyRef: EventHotKeyRef?
    private var activityAssertion: NSObjectProtocol?
    private var sleepAssertionID: IOPMAssertionID?
    private var sleepAssertionMode: String = "none"

    private var lastDndState: Bool = false
    private var lastAvoidingState: Bool = false
    private var lastLoggedPhase: String = ""
    private var lastLoggedAvoiding: Bool = false
    private var lastLoggedAvoidingApp: String = ""
    private var lastLoggedLocked: Bool = false
    private var lastLoggedDnd: Bool = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        // Prevent macOS App Nap & timer coalescing while still allowing idle system sleep
        activityAssertion = ProcessInfo.processInfo.beginActivity(
            options: [.userInitiatedAllowingIdleSystemSleep, .latencyCritical],
            reason: "Keep MoveNow break rhythm timer accurate"
        )
        appendLog("launch")

        activityMonitor = ActivityMonitor()
        engineHost = EngineHost()
        overlayController = OverlayController(bridgeDelegate: self)
        overlayController.onEscKey = { [weak self] in
            self?.handleEscAction()
        }

        setupStatusItem()
        setupPopover()
        registerGlobalHotKey()

        let initial = engineHost.currentSnapshot()
        updateStatusIcon(snapshot: initial.dict)

        let settings = initial.dict["settings"] as? [String: Any]
        let onboarded = settings?["hasCompletedOnboarding"] as? Bool ?? false
        if !onboarded {
            showWelcomeWindow(snapshotJSON: initial.json)
        }

        startTickLoop()
    }

    func applicationWillTerminate(_ notification: Notification) {
        tickTimer?.cancel()
        tickTimer = nil
        releaseSleepAssertion()
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if let welcome = welcomeWindow, welcome.isVisible {
            welcome.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return true
        }
        if let prefs = prefsWindow, prefs.isVisible {
            prefs.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return true
        }
        if let pop = popover, !pop.isShown {
            togglePopover(nil)
        }
        return true
    }

    // MARK: - Status Item & Popover

    private func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        if let button = statusItem.button {
            button.target = self
            button.action = #selector(togglePopover(_:))
            button.toolTip = "MoveNow · 动一下"
            button.image = drawStatusIcon(dnd: false, avoiding: false)
        }
    }

    private func setupPopover() {
        let pop = NSPopover()
        pop.behavior = .transient
        pop.animates = true
        pop.contentSize = NSSize(width: 340, height: 376)

        let vc = NSViewController()
        let vfx = WebViewHost.makeFrostedContainer(cornerRadius: 0, material: .popover)
        vfx.frame = NSRect(x: 0, y: 0, width: 340, height: 376)

        let host = WebViewHost(pageName: "popover", delegate: self)
        host.webView.frame = vfx.bounds
        host.webView.autoresizingMask = [.width, .height]
        vfx.addSubview(host.webView)
        vc.view = vfx

        pop.contentViewController = vc
        self.popover = pop
        self.popoverHost = host
    }

    @objc func togglePopover(_ sender: Any?) {
        guard let button = statusItem?.button, let pop = popover, let engine = engineHost else { return }
        if pop.isShown {
            pop.performClose(sender)
        } else {
            let snap = engine.currentSnapshot()
            popoverHost?.pushSnapshotJSON(snap.json)
            pop.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
            pop.contentViewController?.view.window?.makeKey()
        }
    }

    // MARK: - Welcome & Preferences Windows

    private func showWelcomeWindow(snapshotJSON: String) {
        if let win = welcomeWindow {
            welcomeHost?.pushSnapshotJSON(snapshotJSON)
            win.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return
        }

        let rect = NSRect(x: 0, y: 0, width: 600, height: 490)
        let win = NSWindow(
            contentRect: rect,
            styleMask: [.titled, .closable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        win.titleVisibility = .hidden
        win.titlebarAppearsTransparent = true
        win.isMovableByWindowBackground = true
        win.isOpaque = false
        win.backgroundColor = .clear
        win.center()

        let vfx = WebViewHost.makeFrostedContainer(cornerRadius: 14, material: .hudWindow)
        vfx.frame = rect
        vfx.autoresizingMask = [.width, .height]
        win.contentView = vfx

        let host = WebViewHost(pageName: "welcome", delegate: self)
        host.webView.frame = vfx.bounds
        host.webView.autoresizingMask = [.width, .height]
        vfx.addSubview(host.webView)
        host.pushSnapshotJSON(snapshotJSON)

        self.welcomeWindow = win
        self.welcomeHost = host

        win.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    private func showPreferencesWindow() {
        popover.performClose(nil)
        let snap = engineHost.currentSnapshot()

        if let win = prefsWindow {
            prefsHost?.pushSnapshotJSON(snap.json)
            win.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return
        }

        let rect = NSRect(x: 0, y: 0, width: 520, height: 664)
        let win = NSWindow(
            contentRect: rect,
            styleMask: [.titled, .closable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        win.title = "MoveNow 偏好设置"
        win.titleVisibility = .hidden
        win.titlebarAppearsTransparent = true
        win.isMovableByWindowBackground = true
        win.isOpaque = false
        win.backgroundColor = .clear
        win.isReleasedWhenClosed = false
        win.center()

        let vfx = WebViewHost.makeFrostedContainer(cornerRadius: 14, material: .hudWindow)
        vfx.frame = rect
        vfx.autoresizingMask = [.width, .height]
        win.contentView = vfx

        let host = WebViewHost(pageName: "preferences", delegate: self)
        host.webView.frame = vfx.bounds
        host.webView.autoresizingMask = [.width, .height]
        vfx.addSubview(host.webView)
        host.pushSnapshotJSON(snap.json)

        self.prefsWindow = win
        self.prefsHost = host

        win.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    // MARK: - Tick Loop & Engine Events

    private func startTickLoop() {
        tickTimer?.cancel()
        let timer = DispatchSource.makeTimerSource(flags: .strict, queue: .main)
        timer.schedule(
            deadline: .now() + .milliseconds(500),
            repeating: .milliseconds(500),
            leeway: .milliseconds(50)
        )
        timer.setEventHandler { [weak self] in
            MainActor.assumeIsolated {
                self?.performTick()
            }
        }
        timer.resume()
        tickTimer = timer
    }

    private func performTick() {
        let sensor = activityMonitor.sample()
        let res = engineHost.tick(sensor: sensor)
        logTransitionsIfNeeded(sensor: sensor, snapshot: res.snapshot)
        processEngineResult(res)
    }

    private func logTransitionsIfNeeded(sensor: SensorReading, snapshot: [String: Any]) {
        let phase = snapshot["phase"] as? String ?? "unknown"
        let avoiding = snapshot["avoiding"] as? Bool ?? false
        let reason = snapshot["avoidingReason"] as? String ?? "none"
        let avoidingApp = sensor.avoidingApp ?? ""
        let dnd = snapshot["dndActive"] as? Bool ?? false
        let elapsed = Int((snapshot["workElapsedSec"] as? Double) ?? 0)
        let coalescedJump = sensor.dtSec >= 10.0

        if phase != lastLoggedPhase ||
            avoiding != lastLoggedAvoiding ||
            avoidingApp != lastLoggedAvoidingApp ||
            sensor.isLockedOrAsleep != lastLoggedLocked ||
            dnd != lastLoggedDnd ||
            coalescedJump {
            lastLoggedPhase = phase
            lastLoggedAvoiding = avoiding
            lastLoggedAvoidingApp = avoidingApp
            lastLoggedLocked = sensor.isLockedOrAsleep
            lastLoggedDnd = dnd
            let appDetail = avoidingApp.isEmpty ? reason : "\(reason):\(avoidingApp)"
            let dtNote = coalescedJump ? String(format: " dt=%.1fs", sensor.dtSec) : ""
            appendLog("phase=\(phase) elapsed=\(elapsed)s dnd=\(dnd) avoiding=\(avoiding)(\(appDetail)) locked=\(sensor.isLockedOrAsleep) keyIdle=\(Int(sensor.secondsSinceLastKey))s mouseIdle=\(Int(sensor.secondsSinceLastMouse))s\(dtNote)")
        }
    }

    private func appendLog(_ message: String) {
        let logDir = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Logs")
        let logURL = logDir.appendingPathComponent("MoveNow.log")
        let formatter = ISO8601DateFormatter()
        let line = "[\(formatter.string(from: Date()))] \(message)\n"
        guard let data = line.data(using: .utf8) else { return }
        if let attrs = try? FileManager.default.attributesOfItem(atPath: logURL.path),
           let size = attrs[.size] as? UInt64, size > 65536 {
            try? data.write(to: logURL)
            return
        }
        if let handle = try? FileHandle(forWritingTo: logURL) {
            handle.seekToEndOfFile()
            handle.write(data)
            try? handle.close()
        } else {
            try? data.write(to: logURL)
        }
    }

    private func processEngineResult(_ result: EngineStepResult) {
        var shouldHandoverDisplay = false
        for event in result.events {
            switch event.type {
            case "hide_overlay":
                let restore = event.payload["restoreFocus"] as? Bool ?? true
                let fade = event.payload["peakEndFade"] as? Bool ?? true
                let wakeSeal = (event.payload["wakeSeal"] as? Bool) ?? (event.payload["thawFrost"] as? Bool) ?? false
                overlayController.hideAll(restoreFocus: restore, peakEndFade: fade, thawFrost: wakeSeal)
            case "play_gentle_chime":
                playGentleChime()
            case "stage1_display_handover":
                shouldHandoverDisplay = true
            default:
                break
            }
        }

        let keepAwakeMode: String
        if let mode = result.snapshot["keepAwakeMode"] as? String {
            keepAwakeMode = mode
        } else {
            keepAwakeMode = (result.snapshot["keepAwakeActive"] as? Bool == true) ? "display" : "none"
        }
        syncSleepAssertion(mode: keepAwakeMode)
        if shouldHandoverDisplay {
            requestPoliteDisplaySleepIfUncontested()
        }

        overlayController.update(snapshot: result.snapshot, snapshotJSON: result.snapshotJSON)

        if popover.isShown {
            popoverHost?.pushSnapshotJSON(result.snapshotJSON)
        }
        if prefsWindow?.isVisible == true {
            prefsHost?.pushSnapshotJSON(result.snapshotJSON)
        }
        updateStatusIcon(snapshot: result.snapshot)
    }

    // MARK: - WebBridgeDelegate

    func handleWebMessage(type: String, payload: [String: Any], sourceView: WKWebView) {
        switch type {
        case "ready":
            let snap = engineHost.currentSnapshot()
            let json = snap.json
            if sourceView === popoverHost?.webView {
                popoverHost?.pushSnapshotJSON(json)
            } else if sourceView === prefsHost?.webView {
                prefsHost?.pushSnapshotJSON(json)
            } else if sourceView === welcomeHost?.webView {
                welcomeHost?.pushSnapshotJSON(json)
            } else {
                overlayController.update(snapshot: snap.dict, snapshotJSON: json)
            }

        case "completeOnboarding":
            let res = engineHost.completeOnboarding(payload)
            welcomeWindow?.orderOut(nil)
            welcomeWindow = nil
            welcomeHost = nil
            processEngineResult(res)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self] in
                self?.togglePopover(nil)
            }

        case "updateSettings":
            let res = engineHost.updateSettings(payload)
            processEngineResult(res)

        case "startBreakNow":
            popover.performClose(nil)
            let res = engineHost.startBreakNow(isPreview: false)
            processEngineResult(res)

        case "startPreview":
            prefsWindow?.orderOut(nil)
            popover.performClose(nil)
            let res = engineHost.startBreakNow(isPreview: true)
            processEngineResult(res)

        case "snooze":
            let res = engineHost.snooze()
            processEngineResult(res)

        case "toggleDnd":
            let force = payload["active"] as? Bool
            let res = engineHost.toggleDnd(force)
            processEngineResult(res)

        case "setDndDuration":
            let preset = payload["preset"] as? String ?? "60"
            let res = engineHost.setDndDuration(preset)
            processEngineResult(res)

        case "extendCycle":
            let mins = (payload["minutes"] as? NSNumber)?.intValue ?? 15
            let res = engineHost.extendCurrentCycle(minutes: mins)
            processEngineResult(res)

        case "resetCycle":
            let res = engineHost.resetCurrentCycle()
            processEngineResult(res)

        case "resizePopover":
            if let h = (payload["height"] as? NSNumber)?.doubleValue, h >= 240, h <= 540 {
                let targetSize = NSSize(width: 340, height: CGFloat(h))
                popover?.contentSize = targetSize
                popover?.contentViewController?.view.frame.size = targetSize
            }

        case "escPressed":
            handleEscAction()

        case "wakeFromReturn":
            let res = engineHost.wakeFromReturn()
            processEngineResult(res)

        case "hoverSnooze":
            let hovering = payload["hovering"] as? Bool ?? false
            engineHost.setHoveringSnooze(hovering)

        case "openPreferences":
            showPreferencesWindow()

        case "closePopover":
            popover.performClose(nil)

        case "quitApp":
            NSApp.terminate(nil)

        default:
            break
        }
    }

    private func handleEscAction() {
        let res = engineHost.handleEscKey()
        processEngineResult(res)
    }

    func triggerRestShortcut() {
        popover.performClose(nil)
        let res = engineHost.startBreakNow(isPreview: false)
        processEngineResult(res)
    }

    // MARK: - Global Hotkey (Option + Command + R)

    private func registerGlobalHotKey() {
        gHotKeyAppDelegate = self
        var eventType = EventTypeSpec(
            eventClass: OSType(kEventClassKeyboard),
            eventKind: UInt32(kEventHotKeyPressed)
        )
        InstallEventHandler(
            GetApplicationEventTarget(),
            moveNowHotKeyHandler,
            1,
            &eventType,
            nil,
            nil
        )
        let hotKeyID = EventHotKeyID(signature: OSType(0x4D4E4F57), id: 1) // 'MNOW'
        RegisterEventHotKey(
            UInt32(kVK_ANSI_R),
            UInt32(optionKey | cmdKey),
            hotKeyID,
            GetApplicationEventTarget(),
            0,
            &hotKeyRef
        )
    }

    // MARK: - Adaptive Two-Stage Sealed Keep-Awake (Default OFF; Power & Co-App Aware)

    private func syncSleepAssertion(mode: String) {
        let normalized = (mode == "display" || mode == "system") ? mode : "none"
        if normalized == sleepAssertionMode {
            return
        }
        releaseSleepAssertion()
        guard normalized != "none" else { return }

        let assertionType: CFString = (normalized == "display")
            ? (kIOPMAssertionTypePreventUserIdleDisplaySleep as CFString)
            : (kIOPMAssertionTypePreventUserIdleSystemSleep as CFString)
        let reason: CFString = (normalized == "display")
            ? ("MoveNow stage-1 sealed display & lock keep-awake" as CFString)
            : ("MoveNow stage-2 background agent & task keep-awake" as CFString)

        var id: IOPMAssertionID = 0
        let res = IOPMAssertionCreateWithName(
            assertionType,
            IOPMAssertionLevel(kIOPMAssertionLevelOn),
            reason,
            &id
        )
        if res == kIOReturnSuccess {
            sleepAssertionID = id
            sleepAssertionMode = normalized
            appendLog("sleepAssertion=acquired(\(normalized))")
        }
    }

    private func releaseSleepAssertion() {
        if let id = sleepAssertionID {
            let prevMode = sleepAssertionMode
            IOPMAssertionRelease(id)
            sleepAssertionID = nil
            sleepAssertionMode = "none"
            appendLog("sleepAssertion=released(\(prevMode))")
        }
    }

    private func requestPoliteDisplaySleepIfUncontested() {
        var statusUnmanaged: Unmanaged<CFDictionary>?
        if IOPMCopyAssertionsStatus(&statusUnmanaged) == kIOReturnSuccess,
           let dict = statusUnmanaged?.takeRetainedValue() as? [String: Any] {
            let activeDisplayAssertions = (dict[kIOPMAssertionTypePreventUserIdleDisplaySleep as String] as? NSNumber)?.intValue ?? 0
            if activeDisplayAssertions > 0 {
                appendLog("stage1Handover=deferred(otherDisplayAssertions=\(activeDisplayAssertions))")
                return
            }
        }
        let wrangler = IORegistryEntryFromPath(kIOMainPortDefault, "IOService:/IOResources/IODisplayWrangler")
        guard wrangler != MACH_PORT_NULL else { return }
        defer { IOObjectRelease(wrangler) }
        IORegistryEntrySetCFProperty(wrangler, "IORequestIdle" as CFString, kCFBooleanTrue)
        appendLog("stage1Handover=politeDisplaySleep")
    }

    // MARK: - Quiet Chime & Template Status Icon

    private func playGentleChime() {
        if let sound = NSSound(named: NSSound.Name("Glass")) ?? NSSound(named: NSSound.Name("Tink")) {
            sound.volume = 0.22
            sound.play()
        }
    }

    private func updateStatusIcon(snapshot: [String: Any]) {
        let dnd = snapshot["dndActive"] as? Bool ?? false
        let avoiding = snapshot["avoiding"] as? Bool ?? false
        if dnd == lastDndState && avoiding == lastAvoidingState {
            return
        }
        lastDndState = dnd
        lastAvoidingState = avoiding
        statusItem.button?.image = drawStatusIcon(dnd: dnd, avoiding: avoiding)
        if dnd {
            statusItem.button?.toolTip = "MoveNow · 免打扰中"
        } else if avoiding {
            statusItem.button?.toolTip = "MoveNow · 全屏/投屏静默避让中"
        } else {
            statusItem.button?.toolTip = "MoveNow · 动一下"
        }
    }

    private func drawStatusIcon(dnd: Bool, avoiding: Bool) -> NSImage {
        let size = NSSize(width: 18, height: 18)
        let image = NSImage(size: size, flipped: false) { _ in
            let muted = dnd || avoiding
            let color = NSColor.black.withAlphaComponent(muted ? 0.48 : 0.94)
            color.setStroke()
            color.setFill()

            // Head
            NSBezierPath(ovalIn: NSRect(x: 7.1, y: 11.8, width: 3.8, height: 3.8)).fill()

            // Arms: overhead morning stretch when active; gently lowered at rest when in DND / avoiding
            let arms = NSBezierPath()
            if muted {
                arms.move(to: NSPoint(x: 4.6, y: 6.8))
                arms.curve(
                    to: NSPoint(x: 9.0, y: 10.2),
                    controlPoint1: NSPoint(x: 5.8, y: 9.4),
                    controlPoint2: NSPoint(x: 7.4, y: 10.2)
                )
                arms.curve(
                    to: NSPoint(x: 13.4, y: 6.8),
                    controlPoint1: NSPoint(x: 10.6, y: 10.2),
                    controlPoint2: NSPoint(x: 12.2, y: 9.4)
                )
            } else {
                arms.move(to: NSPoint(x: 3.3, y: 13.2))
                arms.curve(
                    to: NSPoint(x: 9.0, y: 9.8),
                    controlPoint1: NSPoint(x: 4.5, y: 10.4),
                    controlPoint2: NSPoint(x: 6.8, y: 9.8)
                )
                arms.curve(
                    to: NSPoint(x: 14.7, y: 13.2),
                    controlPoint1: NSPoint(x: 11.2, y: 9.8),
                    controlPoint2: NSPoint(x: 13.5, y: 10.4)
                )
            }
            arms.lineWidth = 1.65
            arms.lineCapStyle = .round
            arms.stroke()

            // Torso
            let torso = NSBezierPath()
            torso.move(to: NSPoint(x: 9.0, y: muted ? 10.2 : 9.8))
            torso.line(to: NSPoint(x: 9.0, y: 3.2))
            torso.lineWidth = 1.75
            torso.lineCapStyle = .round
            torso.stroke()

            // Clear visual indicator so DND / avoidance never looks like a silently broken timer
            if dnd {
                NSColor.black.withAlphaComponent(0.88).setStroke()
                let slash = NSBezierPath()
                slash.move(to: NSPoint(x: 3.4, y: 3.4))
                slash.line(to: NSPoint(x: 14.6, y: 14.6))
                slash.lineWidth = 1.5
                slash.lineCapStyle = .round
                slash.stroke()
            } else if avoiding {
                NSColor.black.withAlphaComponent(0.85).setFill()
                NSBezierPath(ovalIn: NSRect(x: 13.4, y: 13.0, width: 3.0, height: 3.0)).fill()
            }

            return true
        }
        image.isTemplate = true
        return image
    }
}
