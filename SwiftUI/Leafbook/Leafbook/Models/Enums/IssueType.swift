//
//  IssueType.swift
//  Leafbook
//
//  Created by Claude on 2/12/26.
//

import Foundation

enum IssueType: String, Codable, CaseIterable, Identifiable {
    case pest
    case disease
    case overwatering
    case underwatering
    case sunburn
    case etiolation
    case nutrientDeficiency = "nutrient_deficiency"
    case rootRot = "root_rot"
    case droppingLeaves = "dropping_leaves"
    case yellowing
    case browning
    case wilting
    case other

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .nutrientDeficiency: return "Nutrient Deficiency"
        case .rootRot: return "Root Rot"
        case .droppingLeaves: return "Dropping Leaves"
        default: return rawValue.capitalized
        }
    }

    var formDescription: String {
        switch self {
        case .pest:
            return "Insects or other pests"
        case .disease:
            return "Fungal or bacterial infection"
        case .overwatering:
            return "Too much water"
        case .underwatering:
            return "Not enough water"
        case .sunburn:
            return "Damage from direct sun"
        case .etiolation:
            return "Stretching from low light"
        case .nutrientDeficiency:
            return "Missing nutrients"
        case .rootRot:
            return "Root damage from excess moisture"
        case .droppingLeaves:
            return "Leaves falling off"
        case .yellowing:
            return "Leaves turning yellow"
        case .browning:
            return "Leaves turning brown"
        case .wilting:
            return "Plant drooping or wilted"
        case .other:
            return "Other issue"
        }
    }
}
