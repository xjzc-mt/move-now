import Cocoa

guard CommandLine.arguments.count > 1 else {
    fputs("Usage: generate_icon.swift <iconset_dir>\n", stderr)
    exit(1)
}

let iconsetPath = CommandLine.arguments[1]
let fm = FileManager.default
try fm.createDirectory(atPath: iconsetPath, withIntermediateDirectories: true)

let specs: [(name: String, px: Int)] = [
    ("icon_16x16.png", 16),
    ("icon_16x16@2x.png", 32),
    ("icon_32x32.png", 32),
    ("icon_32x32@2x.png", 64),
    ("icon_128x128.png", 128),
    ("icon_128x128@2x.png", 256),
    ("icon_256x256.png", 256),
    ("icon_256x256@2x.png", 512),
    ("icon_512x512.png", 512),
    ("icon_512x512@2x.png", 1024)
]

for spec in specs {
    let px = spec.px
    guard let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: px,
        pixelsHigh: px,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    ) else { continue }

    rep.size = NSSize(width: px, height: px)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)

    let size = CGFloat(px)
    let pad = size * 0.085
    let cardRect = NSRect(x: pad, y: pad, width: size - pad * 2, height: size - pad * 2)
    let corner = size * 0.22

    // Warm organic oatmeal matte squircle
    let bg = NSBezierPath(roundedRect: cardRect, xRadius: corner, yRadius: corner)
    NSColor(calibratedRed: 0.96, green: 0.95, blue: 0.92, alpha: 1.0).setFill()
    bg.fill()

    // Subtle hairline border
    NSColor(calibratedRed: 0.20, green: 0.22, blue: 0.24, alpha: 0.08).setStroke()
    bg.lineWidth = max(1.0, size * 0.01)
    bg.stroke()

    // Soft sage outer breathing halo
    let haloRadius = size * 0.31
    let center = NSPoint(x: size * 0.5, y: size * 0.5)
    let haloRect = NSRect(
        x: center.x - haloRadius,
        y: center.y - haloRadius,
        width: haloRadius * 2,
        height: haloRadius * 2
    )
    NSColor(calibratedRed: 0.45, green: 0.62, blue: 0.56, alpha: 0.20).setFill()
    NSBezierPath(ovalIn: haloRect).fill()

    // Warm apricot geometric pebble center
    let bodyW = size * 0.42
    let bodyH = size * 0.40
    let bodyRect = NSRect(
        x: center.x - bodyW / 2,
        y: center.y - bodyH / 2,
        width: bodyW,
        height: bodyH
    )
    let pebble = NSBezierPath(roundedRect: bodyRect, xRadius: bodyW * 0.44, yRadius: bodyH * 0.44)
    NSColor(calibratedRed: 0.87, green: 0.53, blue: 0.40, alpha: 1.0).setFill()
    pebble.fill()

    // Calm eyes (skip tiny 16px detail clutter if < 32)
    if px >= 32 {
        let eyeW = size * 0.036
        let eyeH = size * 0.048
        let eyeY = center.y + size * 0.015
        let offset = size * 0.068
        NSColor(calibratedRed: 0.16, green: 0.18, blue: 0.19, alpha: 0.92).setFill()
        NSBezierPath(ovalIn: NSRect(x: center.x - offset - eyeW / 2, y: eyeY - eyeH / 2, width: eyeW, height: eyeH)).fill()
        NSBezierPath(ovalIn: NSRect(x: center.x + offset - eyeW / 2, y: eyeY - eyeH / 2, width: eyeW, height: eyeH)).fill()
    }

    NSGraphicsContext.restoreGraphicsState()

    if let png = rep.representation(using: .png, properties: [:]) {
        let outURL = URL(fileURLWithPath: iconsetPath).appendingPathComponent(spec.name)
        try png.write(to: outURL)
    }
}
