//
//  WidgetColors.swift
//  LeafbookWidget
//
//  Matches LeafbookColors from the main app.
//

import SwiftUI

enum WidgetColors {
    static let background = Color.adaptive(
        light: Color(red: 0.96, green: 0.95, blue: 0.90),
        dark: Color(red: 0.16, green: 0.16, blue: 0.14)
    )

    static let foreground = Color.adaptive(
        light: Color(red: 0.25, green: 0.23, blue: 0.20),
        dark: Color(red: 0.92, green: 0.91, blue: 0.87)
    )

    static let primary = Color.adaptive(
        light: Color(red: 0.38, green: 0.52, blue: 0.40),
        dark: Color(red: 0.55, green: 0.68, blue: 0.50)
    )

    static let card = Color.adaptive(
        light: Color(red: 0.98, green: 0.97, blue: 0.94),
        dark: Color(red: 0.20, green: 0.20, blue: 0.18)
    )

    static let muted = Color.adaptive(
        light: Color(red: 0.92, green: 0.90, blue: 0.85),
        dark: Color(red: 0.26, green: 0.26, blue: 0.24)
    )

    static let waterBlue = Color.adaptive(
        light: Color(red: 0.23, green: 0.51, blue: 0.85),
        dark: Color(red: 0.40, green: 0.65, blue: 0.95)
    )

    static let issueOrange = Color.adaptive(
        light: Color(red: 0.92, green: 0.45, blue: 0.20),
        dark: Color(red: 0.95, green: 0.60, blue: 0.40)
    )
}

private extension Color {
    static func adaptive(light: Color, dark: Color) -> Color {
        Color(UIColor { traitCollection in
            traitCollection.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
        })
    }
}
