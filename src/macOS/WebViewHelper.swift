import Cocoa
import WebKit

@MainActor
protocol WebBridgeDelegate: AnyObject {
    func handleWebMessage(type: String, payload: [String: Any], sourceView: WKWebView)
}

private final class WeakScriptHandler: NSObject, WKScriptMessageHandler {
    weak var owner: WebViewHost?

    init(owner: WebViewHost) {
        self.owner = owner
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let type = body["type"] as? String else {
            return
        }
        let payload = body["payload"] as? [String: Any] ?? [:]
        Task { @MainActor [weak self] in
            self?.owner?.didReceiveMessage(type: type, payload: payload)
        }
    }
}

@MainActor
final class WebViewHost: NSObject, WKNavigationDelegate {
    let webView: WKWebView
    weak var delegate: WebBridgeDelegate?
    private var isReady: Bool = false
    private var pendingSnapshotJSON: String?

    init(pageName: String, queryItems: [URLQueryItem] = [], delegate: WebBridgeDelegate? = nil) {
        self.delegate = delegate

        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        let ucc = WKUserContentController()
        config.userContentController = ucc

        let wv = WKWebView(frame: .zero, configuration: config)
        wv.setValue(false, forKey: "drawsBackground")
        wv.allowsBackForwardNavigationGestures = false
        self.webView = wv

        super.init()

        let handler = WeakScriptHandler(owner: self)
        ucc.add(handler, name: "moveNow")
        wv.navigationDelegate = self

        loadPage(pageName: pageName, queryItems: queryItems)
    }

    private func loadPage(pageName: String, queryItems: [URLQueryItem]) {
        guard let resourceURL = Bundle.main.resourceURL else {
            NSLog("[MoveNow] Missing bundle resourceURL")
            return
        }
        let uiRoot = resourceURL.appendingPathComponent("ui", isDirectory: true).standardizedFileURL
        let pageURL = uiRoot.appendingPathComponent("views/\(pageName).html").standardizedFileURL
        var comps = URLComponents(url: pageURL, resolvingAgainstBaseURL: true)
        if !queryItems.isEmpty {
            comps?.queryItems = queryItems
        }
        let finalURL = (comps?.url ?? pageURL).standardizedFileURL
        webView.loadFileURL(finalURL, allowingReadAccessTo: uiRoot)
    }

    func pushSnapshotJSON(_ json: String) {
        pendingSnapshotJSON = json
        guard isReady else { return }
        evaluateSnapshot(json)
    }

    func prepareFadeOut() {
        guard isReady else { return }
        webView.evaluateJavaScript("window.__moveNowPrepareFadeOut && window.__moveNowPrepareFadeOut();", completionHandler: nil)
    }

    func startThaw() {
        guard isReady else { return }
        webView.evaluateJavaScript("window.__moveNowStartThaw && window.__moveNowStartThaw();", completionHandler: nil)
    }

    private func evaluateSnapshot(_ json: String) {
        let script = "window.__moveNowReceiveState && window.__moveNowReceiveState(\(json));"
        webView.evaluateJavaScript(script, completionHandler: nil)
    }

    func didReceiveMessage(type: String, payload: [String: Any]) {
        if type == "ready" {
            isReady = true
            if let pending = pendingSnapshotJSON {
                evaluateSnapshot(pending)
            }
        }
        delegate?.handleWebMessage(type: type, payload: payload, sourceView: webView)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        isReady = true
        if let pending = pendingSnapshotJSON {
            evaluateSnapshot(pending)
        }
    }

    static func makeFrostedContainer(
        cornerRadius: CGFloat,
        material: NSVisualEffectView.Material = .hudWindow
    ) -> NSVisualEffectView {
        let vfx = NSVisualEffectView()
        vfx.material = material
        vfx.blendingMode = .behindWindow
        vfx.state = .active
        if cornerRadius > 0 {
            vfx.wantsLayer = true
            vfx.layer?.cornerRadius = cornerRadius
            vfx.layer?.masksToBounds = true
            vfx.maskImage = roundedMaskImage(cornerRadius: cornerRadius)
        }
        return vfx
    }

    private static func roundedMaskImage(cornerRadius r: CGFloat) -> NSImage {
        let edge = r * 2 + 4
        let image = NSImage(size: NSSize(width: edge, height: edge), flipped: false) { rect in
            NSColor.black.setFill()
            NSBezierPath(roundedRect: rect, xRadius: r, yRadius: r).fill()
            return true
        }
        image.capInsets = NSEdgeInsets(top: r, left: r, bottom: r, right: r)
        image.resizingMode = .stretch
        return image
    }
}
