import Cocoa
import CoreGraphics

struct SensorReading {
    let dtSec: Double
    let secondsSinceLastKey: Double
    let secondsSinceLastMouse: Double
    let mouseDeltaPx: Double
    let isMirroring: Bool
    let isFullscreenPresentation: Bool
    let isLockedOrAsleep: Bool
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
            "dayKey": dayKey
        ]
    }
}

@MainActor
final class ActivityMonitor {
    private var lastMousePoint: NSPoint = NSEvent.mouseLocation
    private var lastTickTime: CFAbsoluteTime = CFAbsoluteTimeGetCurrent()
    private var isScreenLocked: Bool = false
    private var isSystemAsleep: Bool = false
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
            Task { @MainActor in self?.isScreenLocked = true }
        }
        dnc.addObserver(
            forName: NSNotification.Name("com.apple.screenIsUnlocked"),
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.isScreenLocked = false
                self?.lastTickTime = CFAbsoluteTimeGetCurrent()
            }
        }

        let wsnc = NSWorkspace.shared.notificationCenter
        wsnc.addObserver(
            forName: NSWorkspace.willSleepNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.isSystemAsleep = true }
        }
        wsnc.addObserver(
            forName: NSWorkspace.didWakeNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.isSystemAsleep = false
                self?.lastTickTime = CFAbsoluteTimeGetCurrent()
            }
        }
    }

    func sample() -> SensorReading {
        let now = CFAbsoluteTimeGetCurrent()
        let dt = max(0.05, min(60.0, now - lastTickTime))
        lastTickTime = now

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

        // Ground-truth live screen lock check + self-healing if a wake notification was ever missed
        let sessionLocked = isSessionScreenLocked()
        if sessionLocked {
            isScreenLocked = true
        } else if isScreenLocked && min(keyIdle, mouseIdle) < 5.0 {
            isScreenLocked = false
        }
        if isSystemAsleep && min(keyIdle, mouseIdle) < 3.0 {
            isSystemAsleep = false
        }

        let mirroring = detectScreenMirroring()
        let presentation = detectFullscreenPresentation()

        return SensorReading(
            dtSec: dt,
            secondsSinceLastKey: keyIdle,
            secondsSinceLastMouse: mouseIdle,
            mouseDeltaPx: mouseDelta,
            isMirroring: mirroring,
            isFullscreenPresentation: presentation,
            isLockedOrAsleep: sessionLocked || isScreenLocked || isSystemAsleep,
            dayKey: dayFormatter.string(from: Date())
        )
    }

    private func isSessionScreenLocked() -> Bool {
        guard let dict = CGSessionCopyCurrentDictionary() as? [String: Any] else {
            return false
        }
        return (dict["CGSSessionScreenIsLocked"] as? Bool) ?? false
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

    private func detectFullscreenPresentation() -> Bool {
        let myPID = ProcessInfo.processInfo.processIdentifier
        guard let frontApp = NSWorkspace.shared.frontmostApplication else {
            return false
        }
        let frontPID = frontApp.processIdentifier
        let frontBundle = frontApp.bundleIdentifier ?? ""
        let frontIsPresenter = presentationBundleIDs.contains(frontBundle)

        guard let windowList = CGWindowListCopyWindowInfo(
            [.optionOnScreenOnly, .excludeDesktopElements],
            kCGNullWindowID
        ) as? [[String: Any]] else {
            return false
        }

        let screenBoundsList = NSScreen.screens.map { $0.frame }

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

            let coversFullScreen = screenBoundsList.contains { frame in
                bounds.width >= frame.width - 2 && bounds.height >= frame.height - 2
            }
            if !coversFullScreen {
                continue
            }

            // Genuine slideshow shield layer (e.g. Keynote/PowerPoint full-screen presentation)
            if layer >= Int(CGWindowLevelForKey(.screenSaverWindow)) - 500 &&
               layer < Int(CGWindowLevelForKey(.screenSaverWindow)) {
                return true
            }
            // Frontmost presentation / meeting / video player app in full screen
            if pid == frontPID && (frontIsPresenter || (layer > 0 && layer < Int(CGWindowLevelForKey(.screenSaverWindow)))) {
                return true
            }
        }
        return false
    }
}
