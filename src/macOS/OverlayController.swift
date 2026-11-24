import Cocoa
import WebKit

private final class KeyablePanel: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { false }
}

private final class PassivePanel: NSPanel {
    override var canBecomeKey: Bool { false }
    override var canBecomeMain: Bool { false }
}

@MainActor
final class OverlayController {
    private weak var bridgeDelegate: WebBridgeDelegate?
    private var windows: [NSWindow] = []
    private var hosts: [WebViewHost] = []
    private var toastWindows: [NSWindow] = []
    private var toastHosts: [WebViewHost] = []
    private var escMonitor: Any?
    private var hideGeneration: Int = 0

    private var previousApp: NSRunningApplication?
    private var lastExternalApp: NSRunningApplication?
    private var activePresentationKey: String?
    private var lastPhase: String = "working"
    private var lastSnapshotJSON: String?
    private var worldSeed: UInt32 = UInt32.random(in: 1...(UInt32.max - 1))
    private var worldOriginMs: Int64 = Int64(Date().timeIntervalSince1970 * 1000)
    var onEscKey: (() -> Void)?

    init(bridgeDelegate: WebBridgeDelegate) {
        self.bridgeDelegate = bridgeDelegate
        if let front = NSWorkspace.shared.frontmostApplication,
           front.bundleIdentifier != Bundle.main.bundleIdentifier {
            self.lastExternalApp = front
        }
        NSWorkspace.shared.notificationCenter.addObserver(
            forName: NSWorkspace.didActivateApplicationNotification,
            object: nil,
            queue: .main
        ) { [weak self] note in
            guard let app = note.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication,
                  app.bundleIdentifier != Bundle.main.bundleIdentifier else {
                return
            }
            Task { @MainActor in
                self?.lastExternalApp = app
            }
        }
        NotificationCenter.default.addObserver(
            forName: NSApplication.didChangeScreenParametersNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                guard let self,
                      let key = self.activePresentationKey,
                      let snapJSON = self.lastSnapshotJSON else { return }
                self.rebuildWindows(forKey: key, snapshotJSON: snapJSON, keepWorldClock: true)
            }
        }
    }

    func update(snapshot: [String: Any], snapshotJSON: String) {
        lastSnapshotJSON = snapshotJSON
        let phase = snapshot["phase"] as? String ?? "working"
        let mode = snapshot["presentationMode"] as? String ?? "fullscreen"
        let toastMsg = snapshot["toastMessage"] as? String
        let prevPhase = lastPhase
        lastPhase = phase

        if let msg = toastMsg, !msg.isEmpty {
            showToast(snapshotJSON: snapshotJSON)
        } else {
            hideToast()
        }

        let desiredKey: String?
        if phase == "pre_alert" {
            desiredKey = "pre_alert"
        } else if phase == "sealed" {
            desiredKey = "break:fullscreen"
        } else if phase == "resting" {
            desiredKey = "break:\(mode)"
        } else {
            desiredKey = nil
        }

        if desiredKey == nil {
            if activePresentationKey != nil {
                hideAll(restoreFocus: true, peakEndFade: true, thawFrost: false)
            }
            return
        }

        if desiredKey != activePresentationKey {
            rebuildWindows(forKey: desiredKey!, snapshotJSON: snapshotJSON, keepWorldClock: false)
        } else {
            if phase == "sealed" && prevPhase != "sealed" {
                worldSeed = UInt32.random(in: 1...(UInt32.max - 1))
                worldOriginMs = Int64(Date().timeIntervalSince1970 * 1000)
                hosts.forEach { $0.syncWorldEpoch(seed: worldSeed, originMs: worldOriginMs) }
            }
            hosts.forEach { $0.pushSnapshotJSON(snapshotJSON) }
        }
    }

    func hideAll(restoreFocus: Bool, peakEndFade: Bool, thawFrost: Bool = false) {
        activePresentationKey = nil
        removeEscMonitor()

        let currentWindows = windows
        let currentHosts = hosts
        let appToRestore = previousApp
        if restoreFocus {
            previousApp = nil
        }

        windows = []
        hosts = []

        guard !currentWindows.isEmpty else { return }

        // Restore focus immediately before/as the veil dissolves so user can resume typing seamlessly
        if restoreFocus {
            restorePreviousAppFocus(appToRestore)
        }

        if peakEndFade || thawFrost {
            hideGeneration += 1
            if thawFrost {
                currentHosts.forEach { $0.startThaw() }
            } else {
                currentHosts.forEach { $0.prepareFadeOut() }
            }
            currentWindows.forEach { $0.ignoresMouseEvents = true }
            NSAnimationContext.runAnimationGroup({ ctx in
                ctx.duration = 0.85
                ctx.timingFunction = CAMediaTimingFunction(name: .easeOut)
                currentWindows.forEach { $0.animator().alphaValue = 0.0 }
            }, completionHandler: {
                Task { @MainActor in
                    currentWindows.forEach { $0.orderOut(nil) }
                }
            })
        } else {
            currentWindows.forEach { $0.orderOut(nil) }
        }
    }

    private func captureFrontmostAppIfNeeded() {
        if let front = NSWorkspace.shared.frontmostApplication,
           front.bundleIdentifier != Bundle.main.bundleIdentifier {
            previousApp = front
            lastExternalApp = front
        } else if let ext = lastExternalApp, !ext.isTerminated {
            previousApp = ext
        }
    }

    private func restorePreviousAppFocus(_ app: NSRunningApplication?) {
        guard let app, !app.isTerminated else { return }
        if #available(macOS 14.0, *) {
            app.activate()
        } else {
            app.activate(options: .activateIgnoringOtherApps)
        }
    }

    private func systemPrimaryScreen() -> NSScreen? {
        let screens = NSScreen.screens
        let mainID = CGMainDisplayID()
        return screens.first { scr in
            guard let num = scr.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? NSNumber else {
                return false
            }
            return CGDirectDisplayID(num.uint32Value) == mainID
        } ?? screens.first
    }

    private func rebuildWindows(forKey key: String, snapshotJSON: String, keepWorldClock: Bool = false) {
        // Tear down prior overlay windows cleanly
        windows.forEach { $0.orderOut(nil) }
        windows = []
        hosts = []
        removeEscMonitor()

        activePresentationKey = key
        let screens = NSScreen.screens
        guard let mainScreen = systemPrimaryScreen() else { return }

        if !keepWorldClock {
            worldSeed = UInt32.random(in: 1...(UInt32.max - 1))
            worldOriginMs = Int64(Date().timeIntervalSince1970 * 1000)
        }

        // Calm Technology & Cognitive Load Principle:
        // Lightweight non-fullscreen capsules/cards appear ONLY on the active screen where the user's cursor/eyes are.
        if key == "pre_alert" {
            let panel = makeTopCapsulePanel(
                screen: mainScreen,
                width: 490,
                height: 54,
                role: "pre_alert",
                snapshotJSON: snapshotJSON
            )
            windows.append(panel)
            return
        }

        if key == "break:corner_card" {
            let width: CGFloat = 348
            let height: CGFloat = 152
            let vf = mainScreen.visibleFrame
            let frame = NSRect(
                x: vf.maxX - width - 20,
                y: vf.minY + 20,
                width: width,
                height: height
            )
            let panel = PassivePanel(
                contentRect: frame,
                styleMask: [.borderless, .nonactivatingPanel],
                backing: .buffered,
                defer: false
            )
            configureFloatingPanel(panel, cornerRadius: 16, material: .hudWindow)
            panel.level = .statusBar
            panel.setFrame(frame, display: true)
            let host = attachWebView(to: panel, role: "corner_card", snapshotJSON: snapshotJSON)
            hosts.append(host)
            fadeInWindow(panel, duration: 0.35)
            windows.append(panel)
            installEscMonitor()
            return
        }

        if key == "break:edge_glow" {
            let pillWidth: CGFloat = 440
            let pillHeight: CGFloat = 56
            for screen in screens {
                let win = NSWindow(
                    contentRect: screen.frame,
                    styleMask: [.borderless],
                    backing: .buffered,
                    defer: false
                )
                win.isOpaque = false
                win.backgroundColor = .clear
                win.hasShadow = false
                win.ignoresMouseEvents = true
                win.isReleasedWhenClosed = false
                win.level = .floating
                win.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .ignoresCycle]
                win.setFrame(screen.frame, display: true)
                let host = WebViewHost(
                    pageName: "overlay",
                    queryItems: [URLQueryItem(name: "role", value: "edge_frame")],
                    delegate: bridgeDelegate
                )
                host.webView.frame = win.contentView?.bounds ?? .zero
                host.webView.autoresizingMask = [.width, .height]
                win.contentView?.addSubview(host.webView)
                host.pushSnapshotJSON(snapshotJSON)
                fadeInWindow(win, duration: 0.45)
                windows.append(win)
                hosts.append(host)

                if screen == mainScreen {
                    let vf = screen.visibleFrame
                    let pillFrame = NSRect(
                        x: vf.midX - pillWidth / 2,
                        y: vf.minY + 26,
                        width: pillWidth,
                        height: pillHeight
                    )
                    let pillPanel = PassivePanel(
                        contentRect: pillFrame,
                        styleMask: [.borderless, .nonactivatingPanel],
                        backing: .buffered,
                        defer: false
                    )
                    configureFloatingPanel(pillPanel, cornerRadius: 28, material: .hudWindow)
                    pillPanel.level = .statusBar
                    pillPanel.setFrame(pillFrame, display: true)
                    let pillHost = attachWebView(to: pillPanel, role: "edge_pill", snapshotJSON: snapshotJSON)
                    hosts.append(pillHost)
                    fadeInWindow(pillPanel, duration: 0.35)
                    windows.append(pillPanel)
                }
            }
            installEscMonitor()
            return
        }

        // Default: break:fullscreen & Stage-2 Sealed Mode
        // Compute unified panoramic desktop coordinate space (top-down CSS points) across all physical displays!
        let minX = screens.map(\.frame.minX).min() ?? 0
        let maxX = screens.map(\.frame.maxX).max() ?? 1440
        let minY = screens.map(\.frame.minY).min() ?? 0
        let maxY = screens.map(\.frame.maxY).max() ?? 900
        let worldW = max(1, Int((maxX - minX).rounded()))
        let worldH = max(1, Int((maxY - minY).rounded()))

        let screenTokens: [String] = screens.map { scr in
            let vx = Int((scr.frame.minX - minX).rounded())
            let vy = Int((maxY - scr.frame.maxY).rounded())
            let vw = max(1, Int(scr.frame.width.rounded()))
            let vh = max(1, Int(scr.frame.height.rounded()))
            let p = (scr == mainScreen) ? 1 : 0
            return "\(vx)_\(vy)_\(vw)_\(vh)_\(p)"
        }
        let screensJoined = screenTokens.joined(separator: ",")

        captureFrontmostAppIfNeeded()
        for screen in screens {
            let isPrimary = (screen == mainScreen)
            let vx = Int((screen.frame.minX - minX).rounded())
            let vy = Int((maxY - screen.frame.maxY).rounded())
            let vw = max(1, Int(screen.frame.width.rounded()))
            let vh = max(1, Int(screen.frame.height.rounded()))

            let win = KeyablePanel(
                contentRect: screen.frame,
                styleMask: [.borderless],
                backing: .buffered,
                defer: false
            )
            win.isOpaque = false
            win.backgroundColor = .clear
            win.hasShadow = false
            win.isReleasedWhenClosed = false
            win.level = .screenSaver
            win.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
            win.setFrame(screen.frame, display: true)

            let vfx = WebViewHost.makeFrostedContainer(cornerRadius: 0, material: .fullScreenUI)
            vfx.frame = win.contentView?.bounds ?? .zero
            vfx.autoresizingMask = [.width, .height]
            win.contentView?.addSubview(vfx)

            let queryItems: [URLQueryItem] = [
                URLQueryItem(name: "role", value: "fullscreen"),
                URLQueryItem(name: "primary", value: isPrimary ? "1" : "0"),
                URLQueryItem(name: "vx", value: String(vx)),
                URLQueryItem(name: "vy", value: String(vy)),
                URLQueryItem(name: "vw", value: String(vw)),
                URLQueryItem(name: "vh", value: String(vh)),
                URLQueryItem(name: "ww", value: String(worldW)),
                URLQueryItem(name: "wh", value: String(worldH)),
                URLQueryItem(name: "seed", value: String(worldSeed)),
                URLQueryItem(name: "t0", value: String(worldOriginMs)),
                URLQueryItem(name: "screens", value: screensJoined)
            ]

            let vpJSON = """
            {"isPrimary":\(isPrimary ? "true" : "false"),"vx":\(vx),"vy":\(vy),"vw":\(vw),"vh":\(vh),"ww":\(worldW),"wh":\(worldH),"seed":\(worldSeed),"originMs":\(worldOriginMs),"screens":"\(screensJoined)"}
            """
            let host = WebViewHost(
                pageName: "overlay",
                queryItems: queryItems,
                delegate: bridgeDelegate
            )
            host.webView.frame = vfx.bounds
            host.webView.autoresizingMask = [.width, .height]
            vfx.addSubview(host.webView)
            host.pushViewportConfigJSON(vpJSON)
            host.pushSnapshotJSON(snapshotJSON)

            win.alphaValue = 0.0
            win.orderFrontRegardless()
            if isPrimary {
                NSApp.activate(ignoringOtherApps: true)
                win.makeKeyAndOrderFront(nil)
            }
            NSAnimationContext.runAnimationGroup { ctx in
                ctx.duration = 0.55
                ctx.timingFunction = CAMediaTimingFunction(name: .easeOut)
                win.animator().alphaValue = 1.0
            }

            windows.append(win)
            hosts.append(host)
        }
        installEscMonitor()
    }

    private func makeTopCapsulePanel(
        screen: NSScreen,
        width: CGFloat,
        height: CGFloat,
        role: String,
        snapshotJSON: String
    ) -> PassivePanel {
        let vf = screen.visibleFrame
        let frame = NSRect(
            x: vf.midX - width / 2,
            y: vf.maxY - height - 16,
            width: width,
            height: height
        )
        let panel = PassivePanel(
            contentRect: frame,
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        configureFloatingPanel(panel, cornerRadius: height / 2, material: .hudWindow)
        panel.level = .statusBar
        panel.setFrame(frame, display: true)
        let host = attachWebView(to: panel, role: role, snapshotJSON: snapshotJSON)
        hosts.append(host)
        fadeInWindow(panel, duration: 0.28)
        return panel
    }

    private func configureFloatingPanel(
        _ panel: NSPanel,
        cornerRadius: CGFloat,
        material: NSVisualEffectView.Material
    ) {
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = true
        panel.level = .floating
        panel.hidesOnDeactivate = false
        panel.isReleasedWhenClosed = false
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .ignoresCycle]
        let vfx = WebViewHost.makeFrostedContainer(cornerRadius: cornerRadius, material: material)
        vfx.frame = panel.contentView?.bounds ?? .zero
        vfx.autoresizingMask = [.width, .height]
        panel.contentView?.addSubview(vfx)
    }

    private func attachWebView(to panel: NSPanel, role: String, snapshotJSON: String) -> WebViewHost {
        let host = WebViewHost(
            pageName: "overlay",
            queryItems: [URLQueryItem(name: "role", value: role)],
            delegate: bridgeDelegate
        )
        if let container = panel.contentView?.subviews.first {
            host.webView.frame = container.bounds
            host.webView.autoresizingMask = [.width, .height]
            container.addSubview(host.webView)
        }
        host.pushSnapshotJSON(snapshotJSON)
        return host
    }

    private func fadeInWindow(_ win: NSWindow, duration: TimeInterval) {
        win.alphaValue = 0.0
        win.orderFrontRegardless()
        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = duration
            ctx.timingFunction = CAMediaTimingFunction(name: .easeOut)
            win.animator().alphaValue = 1.0
        }
    }

    private func showToast(snapshotJSON: String) {
        if !toastWindows.isEmpty {
            toastHosts.forEach { $0.pushSnapshotJSON(snapshotJSON) }
            toastWindows.forEach { $0.orderFrontRegardless() }
            return
        }
        let width: CGFloat = 410
        let height: CGFloat = 46
        guard let targetScreen = systemPrimaryScreen() else { return }
        let vf = targetScreen.visibleFrame
        let frame = NSRect(
            x: vf.midX - width / 2,
            y: vf.maxY - height - 18,
            width: width,
            height: height
        )
        let panel = PassivePanel(
            contentRect: frame,
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        configureFloatingPanel(panel, cornerRadius: 23, material: .hudWindow)
        panel.ignoresMouseEvents = true
        panel.level = .statusBar
        panel.setFrame(frame, display: true)
        let host = attachWebView(to: panel, role: "toast", snapshotJSON: snapshotJSON)
        toastWindows.append(panel)
        toastHosts.append(host)
        fadeInWindow(panel, duration: 0.28)
    }

    private func hideToast() {
        guard !toastWindows.isEmpty else { return }
        let current = toastWindows
        toastWindows = []
        toastHosts = []
        NSAnimationContext.runAnimationGroup({ ctx in
            ctx.duration = 0.35
            current.forEach { $0.animator().alphaValue = 0.0 }
        }, completionHandler: {
            Task { @MainActor in
                current.forEach { $0.orderOut(nil) }
            }
        })
    }

    private func installEscMonitor() {
        removeEscMonitor()
        escMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            if event.keyCode == 53 { // Escape
                self?.onEscKey?()
                return nil
            }
            return event
        }
    }

    private func removeEscMonitor() {
        if let monitor = escMonitor {
            NSEvent.removeMonitor(monitor)
            escMonitor = nil
        }
    }
}
