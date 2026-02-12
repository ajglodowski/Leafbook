import SwiftUI

struct LeafbookLogoView: View {
    let mossColor: Color
    let bgColor: Color
    let lineColor: Color

    init(
        mossColor: Color = Color(red: 0.353, green: 0.478, blue: 0.322),
        bgColor: Color = Color(red: 0.961, green: 0.941, blue: 0.910),
        lineColor: Color = Color(red: 0.290, green: 0.247, blue: 0.208)
    ) {
        self.mossColor = mossColor
        self.bgColor = bgColor
        self.lineColor = lineColor
    }

    var body: some View {
        Canvas { context, _  in
            // Page outline
            var path = Path()
            path.addRoundedRect(in: CGRect(x: 30, y: 20, width: 140, height: 200), cornerSize: CGSize(width: 12, height: 12))
            context.stroke(path, with: .color(mossColor), lineWidth: 3)

            // Book hinge
            var hingePath = Path()
            hingePath.move(to: CGPoint(x: 52, y: 25))
            hingePath.addLine(to: CGPoint(x: 52, y: 215))
            context.stroke(hingePath, with: .color(mossColor), lineWidth: 1)

            // Bookmark
            var bookmarkPath = Path()
            bookmarkPath.move(to: CGPoint(x: 122, y: 20))
            bookmarkPath.addLine(to: CGPoint(x: 122, y: 62))
            bookmarkPath.addLine(to: CGPoint(x: 131, y: 53))
            bookmarkPath.addLine(to: CGPoint(x: 140, y: 62))
            bookmarkPath.addLine(to: CGPoint(x: 140, y: 20))
            bookmarkPath.closeSubpath()
            context.fill(bookmarkPath, with: .color(mossColor.opacity(0.8)))

            // Page lines
            let pageLines = [
                (start: CGPoint(x: 52, y: 178), end: CGPoint(x: 155, y: 178), opacity: 0.45),
                (start: CGPoint(x: 52, y: 191), end: CGPoint(x: 130, y: 191), opacity: 0.35),
                (start: CGPoint(x: 52, y: 204), end: CGPoint(x: 105, y: 204), opacity: 0.25)
            ]

            for line in pageLines {
                var linePath = Path()
                linePath.move(to: line.start)
                linePath.addLine(to: line.end)
                context.stroke(linePath, with: .color(lineColor.opacity(line.opacity)), lineWidth: 1.4)
            }

            // Draw the leaf (rotated -15 degrees around 100, 105)
            let leafTransform = CGAffineTransform(translationX: 100, y: 105)
                .concatenating(CGAffineTransform(rotationAngle: -.pi * 15 / 180))

            // Pointed leaf shape
            var leafPath = Path()
            leafPath.move(to: CGPoint(x: 0, y: -44))
            leafPath.addCurve(
                to: CGPoint(x: 24, y: 8),
                control1: CGPoint(x: 18, y: -36),
                control2: CGPoint(x: 26, y: -14)
            )
            leafPath.addCurve(
                to: CGPoint(x: 0, y: 46),
                control1: CGPoint(x: 22, y: 24),
                control2: CGPoint(x: 12, y: 38)
            )
            leafPath.addCurve(
                to: CGPoint(x: -24, y: 8),
                control1: CGPoint(x: -12, y: 38),
                control2: CGPoint(x: -22, y: 24)
            )
            leafPath.addCurve(
                to: CGPoint(x: 0, y: -44),
                control1: CGPoint(x: -26, y: -14),
                control2: CGPoint(x: -18, y: -36)
            )
            leafPath.closeSubpath()
            leafPath = leafPath.applying(leafTransform)
            context.fill(leafPath, with: .color(mossColor.opacity(0.75)))

            // Midrib
            var midribPath = Path()
            midribPath.move(to: CGPoint(x: 0, y: -42).applying(leafTransform))
            midribPath.addLine(to: CGPoint(x: 0, y: 44).applying(leafTransform))
            context.stroke(midribPath, with: .color(bgColor.opacity(0.5)), lineWidth: 1.8)

            // Vein pair 1
            let vein1Start = CGPoint(x: 0, y: -18).applying(leafTransform)
            let vein1Left = CGPoint(x: -19, y: -6).applying(leafTransform)
            let vein1Right = CGPoint(x: 19, y: -6).applying(leafTransform)

            var vein1LPath = Path()
            vein1LPath.move(to: vein1Start)
            vein1LPath.addLine(to: vein1Left)
            context.stroke(vein1LPath, with: .color(bgColor.opacity(0.4)), lineWidth: 1.2)

            var vein1RPath = Path()
            vein1RPath.move(to: vein1Start)
            vein1RPath.addLine(to: vein1Right)
            context.stroke(vein1RPath, with: .color(bgColor.opacity(0.4)), lineWidth: 1.2)

            // Vein pair 2
            let vein2Start = CGPoint(x: 0, y: 6).applying(leafTransform)
            let vein2Left = CGPoint(x: -21, y: 18).applying(leafTransform)
            let vein2Right = CGPoint(x: 21, y: 18).applying(leafTransform)

            var vein2LPath = Path()
            vein2LPath.move(to: vein2Start)
            vein2LPath.addLine(to: vein2Left)
            context.stroke(vein2LPath, with: .color(bgColor.opacity(0.3)), lineWidth: 1.2)

            var vein2RPath = Path()
            vein2RPath.move(to: vein2Start)
            vein2RPath.addLine(to: vein2Right)
            context.stroke(vein2RPath, with: .color(bgColor.opacity(0.3)), lineWidth: 1.2)

            // Stem
            var stemPath = Path()
            stemPath.move(to: CGPoint(x: 0, y: 44).applying(leafTransform))
            stemPath.addLine(to: CGPoint(x: 3, y: 56).applying(leafTransform))
            context.stroke(stemPath, with: .color(mossColor), lineWidth: 2)
        }
        .frame(width: 200, height: 240)
    }
}

#Preview {
    VStack(spacing: 20) {
        LeafbookLogoView()
        LeafbookLogoView(
            mossColor: Color(red: 0.478, green: 0.667, blue: 0.435),
            bgColor: Color(red: 0.1, green: 0.1, blue: 0.1),
            lineColor: Color(red: 0.8, green: 0.8, blue: 0.8)
        )
    }
    .padding()
}
