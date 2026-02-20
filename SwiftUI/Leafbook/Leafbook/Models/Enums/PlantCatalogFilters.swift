//
//  PlantCatalogFilters.swift
//  Leafbook
//

import Foundation

enum PlantLightLevel: String, CaseIterable, Comparable {
    case dark
    case lowIndirect = "low_indirect"
    case mediumIndirect = "medium_indirect"
    case brightIndirect = "bright_indirect"
    case direct

    var order: Int {
        switch self {
        case .dark:           return 1
        case .lowIndirect:    return 2
        case .mediumIndirect: return 3
        case .brightIndirect: return 4
        case .direct:         return 5
        }
    }

    var label: String {
        switch self {
        case .dark:           return "Dark"
        case .lowIndirect:    return "Low Indirect"
        case .mediumIndirect: return "Medium Indirect"
        case .brightIndirect: return "Bright Indirect"
        case .direct:         return "Direct"
        }
    }

    static func < (lhs: Self, rhs: Self) -> Bool { lhs.order < rhs.order }

    static func from(_ raw: String?) -> PlantLightLevel? {
        guard let raw else { return nil }
        return PlantLightLevel(rawValue: raw)
    }
}

enum PlantSize: String, CaseIterable, Comparable {
    case small
    case medium
    case large
    case extraLarge = "extra_large"

    var order: Int {
        switch self {
        case .small:      return 1
        case .medium:     return 2
        case .large:      return 3
        case .extraLarge: return 4
        }
    }

    var label: String {
        switch self {
        case .small:      return "Small"
        case .medium:     return "Medium"
        case .large:      return "Large"
        case .extraLarge: return "Extra Large"
        }
    }

    static func < (lhs: Self, rhs: Self) -> Bool { lhs.order < rhs.order }

    static func from(_ raw: String?) -> PlantSize? {
        guard let raw else { return nil }
        return PlantSize(rawValue: raw)
    }
}
