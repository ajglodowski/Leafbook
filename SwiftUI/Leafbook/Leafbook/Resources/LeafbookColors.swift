//
//  LeafbookColors.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

enum LeafbookColors {
    // Approximations of the oklch tokens.
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

    // Accent colors for status indicators
    static let waterBlue = Color.adaptive(
        light: Color(red: 0.23, green: 0.51, blue: 0.85),
        dark: Color(red: 0.40, green: 0.65, blue: 0.95)
    )

    static let fertilizerAmber = Color.adaptive(
        light: Color(red: 0.85, green: 0.60, blue: 0.15),
        dark: Color(red: 0.95, green: 0.75, blue: 0.35)
    )

    static let issueOrange = Color.adaptive(
        light: Color(red: 0.92, green: 0.45, blue: 0.20),
        dark: Color(red: 0.95, green: 0.60, blue: 0.40)
    )

    static let roseAccent = Color.adaptive(
        light: Color(red: 0.90, green: 0.45, blue: 0.50),
        dark: Color(red: 0.95, green: 0.60, blue: 0.65)
    )

    static let purpleAccent = Color.adaptive(
        light: Color(red: 0.58, green: 0.40, blue: 0.75),
        dark: Color(red: 0.70, green: 0.55, blue: 0.85)
    )

    static let foregroundLight = Color(red: 0.25, green: 0.23, blue: 0.20)
    static let foregroundDark = Color(red: 0.92, green: 0.91, blue: 0.87)
    static let primaryLight = Color(red: 0.38, green: 0.52, blue: 0.40)
    static let primaryDark = Color(red: 0.55, green: 0.68, blue: 0.50)
    static let cardLight = Color(red: 0.98, green: 0.97, blue: 0.94)
    static let cardDark = Color(red: 0.20, green: 0.20, blue: 0.18)
}

private extension Color {
    static func adaptive(light: Color, dark: Color) -> Color {
        #if os(iOS) || os(tvOS) || os(watchOS)
        return Color(UIColor { traitCollection in
            traitCollection.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
        })
        #elseif os(macOS)
        let adaptiveColor = NSColor(name: NSColor.Name("LeafbookAdaptive")) { appearance in
            let match = appearance.bestMatch(from: [.darkAqua, .aqua])
            return match == .darkAqua ? NSColor(dark) : NSColor(light)
        }
        return Color(adaptiveColor)
        #else
        return light
        #endif
    }
}
