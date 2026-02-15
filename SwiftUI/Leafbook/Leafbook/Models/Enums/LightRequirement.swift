//
//  LightRequirement.swift
//  Leafbook
//
//  Created by Claude on 2/12/26.
//

import Foundation
import SwiftUI

enum LightRequirement: String, Codable, CaseIterable, Identifiable {
    case dark
    case lowIndirect = "low_indirect"
    case mediumIndirect = "medium_indirect"
    case brightIndirect = "bright_indirect"
    case direct

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .lowIndirect: return "Low Indirect"
        case .mediumIndirect: return "Medium Indirect"
        case .brightIndirect: return "Bright Indirect"
        default: return rawValue.capitalized
        }
    }

    var symbolName: String {
        switch self {
        case .dark:
            return "moon.fill"
        case .lowIndirect:
            return "cloud.fill"
        case .mediumIndirect:
            return "sun.haze.fill"
        case .brightIndirect:
            return "sun.max.fill"
        case .direct:
            return "sun.max.fill"
        }
    }

    var tagline: String {
        switch self {
        case .dark:
            return "Loves the shadows 🌑"
        case .lowIndirect:
            return "Cozy corner dweller ☁️"
        case .mediumIndirect:
            return "Just right brightness ✨"
        case .brightIndirect:
            return "Sun-kissed but shaded 🌤️"
        case .direct:
            return "Sunbathing enthusiast ☀️"
        }
    }
}
