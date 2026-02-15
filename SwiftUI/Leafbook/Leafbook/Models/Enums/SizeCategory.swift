//
//  SizeCategory.swift
//  Leafbook
//
//  Created by Claude on 2/12/26.
//

import Foundation
import SwiftUI

enum SizeCategory: String, Codable, CaseIterable, Identifiable {
    case small
    case medium
    case large
    case extraLarge = "extra_large"

    var id: String { rawValue }

    var displayName: String {
        self == .extraLarge ? "Extra Large" : rawValue.capitalized
    }

    var symbolName: String {
        switch self {
        case .small:
            return "leaf.fill"
        case .medium:
            return "leaf.fill"
        case .large:
            return "tree.fill"
        case .extraLarge:
            return "tree.fill"
        }
    }

    var tagline: String {
        switch self {
        case .small:
            return "Compact cutie 🌱"
        case .medium:
            return "Just the right size 🪴"
        case .large:
            return "Big and beautiful 🌿"
        case .extraLarge:
            return "Absolute unit 🌴"
        }
    }
}
