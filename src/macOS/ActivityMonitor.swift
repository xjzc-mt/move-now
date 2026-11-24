import Cocoa
import CoreGraphics
import IOKit.ps

struct SensorReading {
    let dtSec: Double
    let secondsSinceLastKey: Double
    let secondsSinceLastMouse: Double
    let mouseDeltaPx: Double
    let isMirroring: Bool
    let isFullscreenPresentation: Bool
    let avoidingApp: String?
    let isLockedOrAsleep: Bool
    let onBattery: Bool
    let batteryPercent: Int
    let lowPowerMode: Bool
    let dayKey: String

    func toDictionary() -> [String: Any] {
        return [
            "dtSec": dtSec,
            "secondsSinceLastKey": secondsSinceLastKey,
            "secondsSinceLastMouse": secondsSinceLastMouse,
            "mouseDeltaPx": mouseDeltaPx,
            "isMirroring": isMirroring,
            "isFullscreenPresentation": isFullscreenPresentation,
            "isLockedOrAsleep": isLockedOrAsleep,
            "onBattery": onBattery,
            "batteryPercent": batteryPercent,
            "lowPowerMode": lowPowerMode,
            "dayKey": dayKey
        ]
    }
}

@MainActor
final class ActivityMonitor {
    private var lastMousePoint: NSPoint = NSEvent.mouseLocation
    private var lastTickUptime: TimeInterval = ProcessInfo.processInfo.systemUptime
    private var isScreenLocked: Bool = false
    private var screenLockedMarkedAt: TimeInterval = 0
    private var isSystemAsleep: Bool = false
    private var sleepMarkedAt: TimeInterval = 0
    private let dayFormatter: DateFormatter

    private let presentationBundleIDs: Set<String> = [
        "com.apple.iWork.Keynote",
        "com.microsoft.Powerpoint",
        "com.kingsoft.wpsoffice.mac",
        "com.apple.Preview",
        "us.zoom.xos",
        "com.tencent.meeting",
        "com.larksuite.Lark",
        "com.electron.lark",
        "com.apple.QuickTimePlayerX",
        "com.colliderli.iina",
        "org.videolan.vlc"
    ]

    init() {
        let fmt = DateFormatter()
        fmt.calendar = Calendar(identifier: .gregorian)
        fmt.dateFormat = "yyyy-MM-dd"
        self.dayFormatter = fmt
        setupObservers()
    }

    private func setupObservers() {
        let dnc = DistributedNotificationCenter.default()
        dnc.addObserver(
            forName: NSNotification.Name("com.apple.screenIsLocked"),
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.isScreenLocked = true
                self?.screenLockedMarkedAt = ProcessInfo.processInfo.systemUptime
            }
        }
        dnc.addObserver(
            forName: NSNotification.Name("com.apple.screenIsUnlocked"),
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.isScreenLocked = false
                self?.lastTickUptime = ProcessInfo.processInfo.systemUptime
            }
        }

        let wsnc = NSWorkspace.shared.notificationCenter
        wsnc.addObserver(
            forName: NSWorkspace.willSleepNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.isSystemAsleep = true
                self?.sleepMarkedAt = ProcessInfo.processInfo.systemUptime
            }
        }
        wsnc.addObserver(
            forName: NSWorkspace.didWakeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.isSystemAsleep = false
                self?.lastTickUptime = ProcessInfo.processInfo.systemUptime
            }
        }
    }

    func sample() -> SensorReading {
        // Monotonic uptime pauses during genuine system sleep and is immune to NTP wall-clock jumps
        let now = ProcessInfo.processInfo.systemUptime
        let dt = max(0.05, min(300.0, now - lastTickUptime))
        lastTickUptime = now

        let keyIdle = CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: .keyDown)
        let mouseMoveIdle = CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: .mouseMoved)
        let leftClickIdle = CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: .leftMouseDown)
        let rightClickIdle = CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: .rightMouseDown)
        let scrollIdle = CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: .scrollWheel)
        let anyEventIdle = CGEventType(rawValue: ~0).map {
            CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: $0)
        } ?? min(keyIdle, mouseMoveIdle)
        let mouseIdle = min(anyEventIdle, min(mouseMoveIdle, min(leftClickIdle, min(rightClickIdle, scrollIdle))))

        let currentMouse = NSEvent.mouseLocation
        let dx = currentMouse.x - lastMousePoint.x
        let dy = currentMouse.y - lastMousePoint.y
        let mouseDelta = hypot(dx, dy)
        lastMousePoint = currentMouse

        // Ground-truth live screen lock check:
        // If session is unlocked and past the 2s notification race window, clear isScreenLocked immediately
        // even if screenIsUnlocked notification was missed and user hasn't moved mouse yet.
        let sessionLocked = isSessionScreenLocked()
        if sessionLocked {
            isScreenLocked = true
            screenLockedMarkedAt = now
        } else if isScreenLocked && (min(keyIdle, mouseIdle) < 5.0 || (now - screenLockedMarkedAt) > 2.0) {
            isScreenLocked = false
        }

        // Self-heal isSystemAsleep if didWakeNotification was missed or sleep was aborted
        if isSystemAsleep && (min(keyIdle, mouseIdle) < 3.0 || ((now - sleepMarkedAt) > 10.0 && dt < 5.0)) {
            isSystemAsleep = false
        }

        let mirroring = detectScreenMirroring()
        let presentationApp = detectFullscreenPresentation()
        let power = samplePowerState()

        return SensorReading(
            dtSec: dt,
            secondsSinceLastKey: keyIdle,
            secondsSinceLastMouse: mouseIdle,
            mouseDeltaPx: mouseDelta,
            isMirroring: mirroring,
            isFullscreenPresentation: presentationApp != nil,
            avoidingApp: mirroring ? "mirroring" : presentationApp,
            isLockedOrAsleep: sessionLocked || isScreenLocked || isSystemAsleep,
            onBattery: power.onBattery,
            batteryPercent: power.batteryPercent,
            lowPowerMode: power.lowPowerMode,
            dayKey: dayFormatter.string(from: Date())
        )
    }

    private func samplePowerState() -> (onBattery: Bool, batteryPercent: Int, lowPowerMode: Bool) {
        let lowPower = ProcessInfo.processInfo.isLowPowerModeEnabled
        guard let blob = IOPSCopyPowerSourcesInfo()?.takeRetainedValue(),
              let list = IOPSCopyPowerSourcesList(blob)?.takeRetainedValue() as? [CFTypeRef],
              !list.isEmpty else {
            return (false, 100, lowPower)
        }
        var onBattery = false
        var pct = 100
        for ps in list {
            guard let desc = IOPSGetPowerSourceDescription(blob, ps)?.takeUnretainedValue() as? [String: Any] else {
                continue
            }
            if let state = desc[kIOPSPowerSourceStateKey as String] as? String,
               state == (kIOPSBatteryPowerValue as String) {
                onBattery = true
            }
            if let cur = desc[kIOPSCurrentCapacityKey as String] as? Int,
               let maxCap = desc[kIOPSMaxCapacityKey as String] as? Int,
               maxCap > 0 {
                pct = max(0, min(100, Int(round(Double(cur) * 100.0 / Double(maxCap)))))
            }
        }
        return (onBattery, pct, lowPower)
    }

    private func isSessionScreenLocked() -> Bool {
        guard let dict = CGSessionCopyCurrentDictionary() as? [String: Any] else {
            return false
        }
        if let locked = dict["CGSSessionScreenIsLocked"] as? Bool, locked {
            return true
        }
        if let onConsole = dict["kCGSSessionOnConsoleKey"] as? Bool, !onConsole {
            return true
        }
        return false
    }

    private func detectScreenMirroring() -> Bool {
        for screen in NSScreen.screens {
            if let num = screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? NSNumber {
                let displayID = CGDirectDisplayID(num.uint32Value)
                if CGDisplayIsInMirrorSet(displayID) != 0 {
                    return true
                }
            }
        }
        return false
    }

    private let ignoredSystemBundleIDs: Set<String> = [
        "com.apple.dock",
        "com.apple.finder",
        "com.apple.controlcenter",
        "com.apple.notificationcenterui",
        "com.apple.Spotlight",
        "com.apple.WindowManager",
        "com.apple.loginwindow"
    ]

    private func quartzDisplayRects() -> [CGRect] {
        var rects: [CGRect] = []
        for screen in NSScreen.screens {
            if let num = screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? NSNumber {
                let displayID = CGDirectDisplayID(num.uint32Value)
                let rect = CGDisplayBounds(displayID)
                if rect.width > 0 && rect.height > 0 {
                    rects.append(rect)
                }
            }
        }
        return rects
    }

    private func displayRect(containing bounds: CGRect, in displayRects: [CGRect]) -> CGRect? {
        let center = CGPoint(x: bounds.midX, y: bounds.midY)
        if let hit = displayRects.first(where: { $0.contains(center) }) {
            return hit
        }
        // Fallback: display with largest intersection area
        var best: CGRect?
        var bestArea: CGFloat = 0
        for rect in displayRects {
            let inter = bounds.intersection(rect)
            if !inter.isNull {
                let area = inter.width * inter.height
                if area > bestArea {
                    bestArea = area
                    best = rect
                }
            }
        }
        return best
    }

    private func detectFullscreenPresentation() -> String? {
        let myPID = ProcessInfo.processInfo.processIdentifier
        guard let frontApp = NSWorkspace.shared.frontmostApplication else {
            return nil
        }
        let frontPID = frontApp.processIdentifier
        let frontBundle = frontApp.bundleIdentifier ?? ""
        let frontIsPresenter = presentationBundleIDs.contains(frontBundle)

        guard let windowList = CGWindowListCopyWindowInfo(
            [.optionOnScreenOnly, .excludeDesktopElements],
            kCGNullWindowID
        ) as? [[String: Any]] else {
            return nil
        }

        // Use Quartz global display coordinates matching kCGWindowBounds exactly
        let displayRects = quartzDisplayRects()
        if displayRects.isEmpty {
            return nil
        }

        for win in windowList {
            guard let pid = win[kCGWindowOwnerPID as String] as? Int32, pid != myPID else {
                continue
            }

            let ownerName = win[kCGWindowOwnerName as String] as? String ?? ""
            if ownerName == "Window Server" {
                continue
            }

            let alpha = win[kCGWindowAlpha as String] as? Double ?? 1.0
            if alpha < 0.95 {
                // Ignore transparent screen watermarks / enterprise DLP overlays (e.g. Feilian)
                continue
            }

            let app = NSRunningApplication(processIdentifier: pid)
            let bundleID = app?.bundleIdentifier ?? ""
            if ignoredSystemBundleIDs.contains(bundleID) {
                continue
            }

            let layer = win[kCGWindowLayer as String] as? Int ?? 0
            guard let boundsDict = win[kCGWindowBounds as String] as? [String: Any],
                  let bounds = CGRect(dictionaryRepresentation: boundsDict as CFDictionary) else {
                continue
            }

            // Match window against the EXACT display it occupies (fixes dual-screen false positive
            // where a normal window on a 2K display was >= MacBook's smaller screen size).
            // Requiring origin alignment (minX/minY within 4pt) also excludes regular maximized windows
            // that sit below the macOS menu bar.
            guard let hostDisplay = displayRect(containing: bounds, in: displayRects) else {
                continue
            }
            let coversOwnDisplay =
                abs(bounds.minX - hostDisplay.minX) <= 4 &&
                abs(bounds.minY - hostDisplay.minY) <= 4 &&
                bounds.width >= hostDisplay.width - 4 &&
                bounds.height >= hostDisplay.height - 4
            if !coversOwnDisplay {
                continue
            }

            let appLabel = bundleID.isEmpty ? ownerName : bundleID

            // Genuine slideshow shield layer (e.g. Keynote/PowerPoint full-screen presentation)
            if layer >= Int(CGWindowLevelForKey(.screenSaverWindow)) - 500 &&
               layer < Int(CGWindowLevelForKey(.screenSaverWindow)) {
                return appLabel
            }
            // Frontmost presentation / meeting / video player app genuinely covering its entire display
            if pid == frontPID && (frontIsPresenter || (layer > 0 && layer < Int(CGWindowLevelForKey(.screenSaverWindow)))) {
                return appLabel
            }
        }
        return nil
    }
}
