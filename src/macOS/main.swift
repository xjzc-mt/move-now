import Cocoa

let bundleID = Bundle.main.bundleIdentifier ?? "com.movenow.app"
let running = NSRunningApplication.runningApplications(withBundleIdentifier: bundleID)
let currentPID = ProcessInfo.processInfo.processIdentifier

if let existing = running.first(where: { $0.processIdentifier != currentPID }) {
    if #available(macOS 14.0, *) {
        existing.activate()
    } else {
        existing.activate(options: .activateIgnoringOtherApps)
    }
    exit(0)
}

MainActor.assumeIsolated {
    let app = NSApplication.shared
    let delegate = AppDelegate()
    app.delegate = delegate
    app.run()
}
