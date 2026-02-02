//
//  PlantDetailTab.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import Foundation

enum PlantDetailTab: String, CaseIterable, Identifiable {
    case overview
    case care
    case timeline
    case photos
    case propagation
    case notes
    case typeInfo

    var id: String { rawValue }

    var title: String {
        switch self {
        case .overview: return "Overview"
        case .care: return "Care"
        case .timeline: return "Timeline"
        case .photos: return "Photos"
        case .propagation: return "Propagation"
        case .notes: return "Notes"
        case .typeInfo: return "Type"
        }
    }

    var iconName: String {
        switch self {
        case .overview: return "leaf.fill"
        case .care: return "drop.fill"
        case .timeline: return "clock.arrow.circlepath"
        case .photos: return "photo.on.rectangle"
        case .propagation: return "sparkles"
        case .notes: return "note.text"
        case .typeInfo: return "info.circle"
        }
    }
}

extension PlantDetailTab: @MainActor IconLabelTabItem {}
