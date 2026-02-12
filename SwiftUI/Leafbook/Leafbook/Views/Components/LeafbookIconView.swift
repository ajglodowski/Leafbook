import SwiftUI

struct LeafbookIconView: View {
    let mossColor: Color
    let bgColor: Color

    init(
        mossColor: Color = Color(red: 0.353, green: 0.478, blue: 0.322),
        bgColor: Color = Color(red: 0.961, green: 0.941, blue: 0.910)
    ) {
        self.mossColor = mossColor
        self.bgColor = bgColor
    }

    var body: some View {
        Canvas { context, _  in
            // Background rounded square
            var bgPath = Path()
            bgPath.addRoundedRect(in: CGRect(x: 0, y: 0, width: 120, height: 120), cornerSize: CGSize(width: 24, height: 24))
            context.fill(bgPath, with: .color(mossColor.opacity(0.12)))

            // Bookmark ribbon — top right corner
            var bookmarkPath = Path()
            bookmarkPath.move(to: CGPoint(x: 82, y: 0))
            bookmarkPath.addLine(to: CGPoint(x: 82, y: 28))
            bookmarkPath.addLine(to: CGPoint(x: 90, y: 22))
            bookmarkPath.addLine(to: CGPoint(x: 98, y: 28))
            bookmarkPath.addLine(to: CGPoint(x: 98, y: 0))
            bookmarkPath.closeSubpath()
            context.fill(bookmarkPath, with: .color(mossColor.opacity(0.8)))

            // Draw the leaf (rotated -15 degrees around 54, 56)
            let leafTransform = CGAffineTransform(translationX: 54, y: 56)
                .concatenating(CGAffineTransform(rotationAngle: -.pi * 15 / 180))

            // Pointed leaf shape
            var leafPath = Path()
            leafPath.move(to: CGPoint(x: 0, y: -42))
            leafPath.addCurve(
                to: CGPoint(x: 24, y: 8),
                control1: CGPoint(x: 18, y: -34),
                control2: CGPoint(x: 27, y: -14)
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
                to: CGPoint(x: 0, y: -42),
                control1: CGPoint(x: -27, y: -14),
                control2: CGPoint(x: -18, y: -34)
            )
            leafPath.closeSubpath()
            leafPath = leafPath.applying(leafTransform)
            context.fill(leafPath, with: .color(mossColor.opacity(0.9)))

            // Midrib
            var midribPath = Path()
            midribPath.move(to: CGPoint(x: 0, y: -40).applying(leafTransform))
            midribPath.addLine(to: CGPoint(x: 0, y: 44).applying(leafTransform))
            context.stroke(midribPath, with: .color(bgColor.opacity(0.55)), lineWidth: 2.2)

            // Vein pair 1
            let vein1Start = CGPoint(x: 0, y: -18).applying(leafTransform)
            let vein1Left = CGPoint(x: -19, y: -6).applying(leafTransform)
            let vein1Right = CGPoint(x: 19, y: -6).applying(leafTransform)

            var vein1LPath = Path()
            vein1LPath.move(to: vein1Start)
            vein1LPath.addLine(to: vein1Left)
            context.stroke(vein1LPath, with: .color(bgColor.opacity(0.45)), lineWidth: 1.6)

            var vein1RPath = Path()
            vein1RPath.move(to: vein1Start)
            vein1RPath.addLine(to: vein1Right)
            context.stroke(vein1RPath, with: .color(bgColor.opacity(0.45)), lineWidth: 1.6)

            // Vein pair 2
            let vein2Start = CGPoint(x: 0, y: 6).applying(leafTransform)
            let vein2Left = CGPoint(x: -21, y: 18).applying(leafTransform)
            let vein2Right = CGPoint(x: 21, y: 18).applying(leafTransform)

            var vein2LPath = Path()
            vein2LPath.move(to: vein2Start)
            vein2LPath.addLine(to: vein2Left)
            context.stroke(vein2LPath, with: .color(bgColor.opacity(0.35)), lineWidth: 1.6)

            var vein2RPath = Path()
            vein2RPath.move(to: vein2Start)
            vein2RPath.addLine(to: vein2Right)
            context.stroke(vein2RPath, with: .color(bgColor.opacity(0.35)), lineWidth: 1.6)

            // Stem
            var stemPath = Path()
            stemPath.move(to: CGPoint(x: 0, y: 44).applying(leafTransform))
            stemPath.addLine(to: CGPoint(x: 3, y: 56).applying(leafTransform))
            context.stroke(stemPath, with: .color(mossColor), lineWidth: 2.5)
        }
        .frame(width: 120, height: 120)
    }
}

#Preview {
    VStack(spacing: 20) {
        LeafbookIconView()
        LeafbookIconView(
            mossColor: Color(red: 0.478, green: 0.667, blue: 0.435),
            bgColor: Color(red: 0.1, green: 0.1, blue: 0.1)
        )
    }
    .padding()
}
