//
//  TaxonomicRank.swift
//  Leafbook
//

import Foundation

enum TaxonomicRank: String, CaseIterable {
    case kingdom
    case phylum
    case `class`
    case order
    case family
    case subfamily
    case tribe
    case genus
    case species
    case subspecies
    case variety

    var displayLabel: String {
        switch self {
        case .kingdom: return "Kingdom"
        case .phylum: return "Phylum"
        case .class: return "Class"
        case .order: return "Order"
        case .family: return "Family"
        case .subfamily: return "Subfamily"
        case .tribe: return "Tribe"
        case .genus: return "Genus"
        case .species: return "Species"
        case .subspecies: return "Subspecies"
        case .variety: return "Variety"
        }
    }

    static func from(_ string: String?) -> TaxonomicRank? {
        guard let string else { return nil }
        return TaxonomicRank(rawValue: string.lowercased())
    }
}
