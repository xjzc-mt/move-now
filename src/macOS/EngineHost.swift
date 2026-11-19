import Foundation
import JavaScriptCore
import ServiceManagement

struct EngineEvent {
    let type: String
    let payload: [String: Any]
}

struct EngineStepResult {
    let snapshot: [String: Any]
    let snapshotJSON: String
    let events: [EngineEvent]
}

@MainActor
final class EngineHost {
    private let context: JSContext
    private let engineValue: JSValue
    private let defaults = UserDefaults.standard

    private let settingsKey = "MoveNow.settings.v1"
    private let statsDayKey = "MoveNow.stats.day"
    private let statsCountKey = "MoveNow.stats.count"

    init() {
        guard let ctx = JSContext() else {
            fatalError("Failed to create JavaScriptCore context")
        }
        ctx.exceptionHandler = { _, exception in
            if let exc = exception {
                NSLog("[MoveNow JSContext Error] %@", exc.toString() ?? "unknown")
            }
        }
        self.context = ctx

        let resourceBase = Bundle.main.resourceURL?.appendingPathComponent("ui/core")
        let actionsURL = resourceBase?.appendingPathComponent("actions.js")
        let smURL = resourceBase?.appendingPathComponent("state-machine.js")

        guard let aURL = actionsURL,
              let sURL = smURL,
              let actionsSource = try? String(contentsOf: aURL, encoding: .utf8),
              let smSource = try? String(contentsOf: sURL, encoding: .utf8) else {
            fatalError("Missing ui/core/actions.js or state-machine.js in bundle resources")
        }

        ctx.evaluateScript(actionsSource, withSourceURL: aURL)
        ctx.evaluateScript(smSource, withSourceURL: sURL)

        let savedSettings = defaults.dictionary(forKey: settingsKey) ?? [:]
        let settingsJSON = Self.encodeJSON(savedSettings) ?? "{}"
        let fmt = DateFormatter()
        fmt.calendar = Calendar(identifier: .gregorian)
        fmt.dateFormat = "yyyy-MM-dd"
        let todayKey = fmt.string(from: Date())
        let restoredCount = defaults.string(forKey: statsDayKey) == todayKey
            ? defaults.integer(forKey: statsCountKey)
            : 0

        let createScript = """
        (function() {
            var engine = MoveNowStateMachine.createEngine(\(settingsJSON), {
                dayKey: '\(todayKey)',
                todayBreakCount: \(restoredCount)
            });
            globalThis.__moveNowEngine = engine;
            return engine;
        })();
        """
        guard let engine = ctx.evaluateScript(createScript), !engine.isUndefined else {
            fatalError("Failed to instantiate MoveNowStateMachine engine")
        }
        self.engineValue = engine
    }

    func tick(sensor: SensorReading) -> EngineStepResult {
        let sensorJSON = Self.encodeJSON(sensor.toDictionary()) ?? "{}"
        return callEngine("globalThis.__moveNowEngine.tick(\(sensorJSON))")
    }

    func snooze() -> EngineStepResult {
        return callEngine("globalThis.__moveNowEngine.snooze()")
    }

    func handleEscKey() -> EngineStepResult {
        return callEngine("globalThis.__moveNowEngine.handleEscKey()")
    }

    func startBreakNow(isPreview: Bool) -> EngineStepResult {
        return callEngine("globalThis.__moveNowEngine.startBreakNow({ isPreview: \(isPreview ? "true" : "false") })")
    }

    func toggleDnd(_ force: Bool? = nil) -> EngineStepResult {
        if let f = force {
            return callEngine("globalThis.__moveNowEngine.toggleDnd(\(f ? "true" : "false"))")
        }
        return callEngine("globalThis.__moveNowEngine.toggleDnd()")
    }

    func setDndDuration(_ preset: String) -> EngineStepResult {
        let escaped = preset.replacingOccurrences(of: "'", with: "")
        return callEngine("globalThis.__moveNowEngine.setDndDuration('\(escaped)')")
    }

    func extendCurrentCycle(minutes: Int) -> EngineStepResult {
        return callEngine("globalThis.__moveNowEngine.extendCurrentCycle(\(minutes))")
    }

    func resetCurrentCycle() -> EngineStepResult {
        return callEngine("globalThis.__moveNowEngine.resetCurrentCycle()")
    }

    func wakeFromReturn() -> EngineStepResult {
        return callEngine("globalThis.__moveNowEngine.wakeFromReturn()")
    }

    func updateSettings(_ patch: [String: Any]) -> EngineStepResult {
        let patchJSON = Self.encodeJSON(patch) ?? "{}"
        let result = callEngine("globalThis.__moveNowEngine.updateSettings(\(patchJSON))")
        persistSettingsAndSideEffects(from: result, patch: patch)
        return result
    }

    func completeOnboarding(_ patch: [String: Any]) -> EngineStepResult {
        let patchJSON = Self.encodeJSON(patch) ?? "{}"
        let result = callEngine("globalThis.__moveNowEngine.completeOnboarding(\(patchJSON))")
        persistSettingsAndSideEffects(from: result, patch: patch)
        return result
    }

    func setHoveringSnooze(_ hovering: Bool) {
        context.evaluateScript("globalThis.__moveNowEngine.setHoveringSnooze(\(hovering ? "true" : "false"))")
    }

    func currentSnapshot() -> (dict: [String: Any], json: String) {
        let jsonStr = context.evaluateScript("JSON.stringify(globalThis.__moveNowEngine.getSnapshot())")?.toString() ?? "{}"
        let dict = Self.decodeJSON(jsonStr) ?? [:]
        return (dict, jsonStr)
    }

    private func callEngine(_ expr: String) -> EngineStepResult {
        let wrapped = """
        (function() {
            var res = \(expr);
            return JSON.stringify(res);
        })();
        """
        let raw = context.evaluateScript(wrapped)?.toString() ?? "{}"
        let parsed = Self.decodeJSON(raw) ?? [:]
        let snapshot = parsed["snapshot"] as? [String: Any] ?? [:]
        let snapshotJSON = Self.encodeJSON(snapshot) ?? "{}"

        let rawEvents = parsed["events"] as? [[String: Any]] ?? []
        let events = rawEvents.map { dict in
            EngineEvent(type: dict["type"] as? String ?? "", payload: dict)
        }

        if let day = snapshot["dayKey"] as? String,
           let count = snapshot["todayBreakCount"] as? Int {
            defaults.set(day, forKey: statsDayKey)
            defaults.set(count, forKey: statsCountKey)
        }

        return EngineStepResult(snapshot: snapshot, snapshotJSON: snapshotJSON, events: events)
    }

    private func persistSettingsAndSideEffects(from result: EngineStepResult, patch: [String: Any]) {
        if let settings = result.snapshot["settings"] as? [String: Any] {
            defaults.set(settings, forKey: settingsKey)
        }
        if let launch = patch["launchAtLogin"] as? Bool {
            updateLaunchAtLogin(enabled: launch)
        }
    }

    private func updateLaunchAtLogin(enabled: Bool) {
        if #available(macOS 13.0, *) {
            do {
                if enabled {
                    try SMAppService.mainApp.register()
                } else {
                    try SMAppService.mainApp.unregister()
                }
            } catch {
                NSLog("[MoveNow] SMAppService update failed: %@", error.localizedDescription)
            }
        }
    }

    static func encodeJSON(_ obj: Any) -> String? {
        guard JSONSerialization.isValidJSONObject(obj),
              let data = try? JSONSerialization.data(withJSONObject: obj, options: []),
              let str = String(data: data, encoding: .utf8) else {
            return nil
        }
        return str
    }

    static func decodeJSON(_ str: String) -> [String: Any]? {
        guard let data = str.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data, options: []),
              let dict = obj as? [String: Any] else {
            return nil
        }
        return dict
    }
}
