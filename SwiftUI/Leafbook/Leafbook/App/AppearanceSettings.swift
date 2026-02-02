//
//  AppearanceSettings.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Combine
import SwiftUI

final class AppearanceSettings: ObservableObject {
    enum ThemeOption: String, CaseIterable, Identifiable {
        case system
        case light
        case dark

        var id: String { rawValue }

        var label: String {
            switch self {
            case .system: return "System"
            case .light: return "Light"
            case .dark: return "Dark"
            }
        }

        var preferredColorScheme: ColorScheme? {
            switch self {
            case .system: return nil
            case .light: return .light
            case .dark: return .dark
            }
        }
    }

    @AppStorage("leafbook.appearance.theme") private var storedTheme = ThemeOption.system.rawValue

    var theme: ThemeOption {
        get { ThemeOption(rawValue: storedTheme) ?? .system }
        set { storedTheme = newValue.rawValue }
    }

    var preferredColorScheme: ColorScheme? {
        theme.preferredColorScheme
    }
}
