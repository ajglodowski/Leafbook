//
//  PlantLocation.swift
//  Leafbook
//
//  Created by Claude on 2/12/26.
//

import Foundation
import SwiftUI

enum PlantLocation: String, Codable, CaseIterable, Identifiable {
    case indoor
    case outdoor
    case both

    var id: String { rawValue }

    var displayName: String { rawValue.capitalized }

    var symbolName: String {
        switch self {
        case .indoor:
            return "house.fill"
        case .outdoor:
            return "tree.fill"
        case .both:
            return "arrow.left.arrow.right"
        }
    }

    var badgeColor: Color {
        switch self {
        case .indoor:
            return LeafbookColors.waterBlue
        case .outdoor:
            return LeafbookColors.primary
        case .both:
            return LeafbookColors.purpleAccent
        }
    }
}
