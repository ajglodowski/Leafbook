//
//  TimelineEventType.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/1/26.
//  Extracted to separate file by Claude on 2/12/26.
//

import Foundation
import SwiftUI

enum TimelineEventType: String, Codable, CaseIterable, Identifiable {
    case watered
    case fertilized
    case repotted
    case moved
    case pruned
    case rotated
    case misted
    case cleaned
    case propagated
    case acquired
    case legacy
    case restored
    case other

    var id: String { rawValue }

    var displayName: String {
        rawValue.replacingOccurrences(of: "_", with: " ").capitalized
    }

    var symbolName: String {
        switch self {
        case .watered:
            return "drop.fill"
        case .fertilized:
            return "sparkles"
        case .repotted:
            return "shippingbox.fill"
        case .moved:
            return "arrow.up.right.square"
        case .pruned:
            return "scissors"
        case .rotated:
            return "arrow.triangle.2.circlepath"
        case .misted:
            return "cloud.drizzle.fill"
        case .cleaned:
            return "wind"
        case .propagated:
            return "leaf.arrow.circlepath"
        case .acquired:
            return "gift.fill"
        case .legacy:
            return "archivebox.fill"
        case .restored:
            return "arrow.uturn.backward.circle.fill"
        case .other:
            return "leaf.fill"
        }
    }

    var badgeColor: Color {
        switch self {
        case .watered:
            return LeafbookColors.waterBlue
        case .fertilized:
            return LeafbookColors.fertilizerAmber
        case .repotted:
            return LeafbookColors.primary
        case .moved:
            return LeafbookColors.purpleAccent
        case .pruned:
            return LeafbookColors.roseAccent
        case .rotated:
            return LeafbookColors.purpleAccent
        case .misted:
            return LeafbookColors.waterBlue
        case .cleaned:
            return LeafbookColors.primary
        case .propagated:
            return LeafbookColors.primary
        case .acquired:
            return LeafbookColors.roseAccent
        case .legacy:
            return LeafbookColors.foreground
        case .restored:
            return LeafbookColors.primary
        case .other:
            return LeafbookColors.primary
        }
    }
}
