//
//  PropagationGroup.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import Foundation

struct PropagationPlant: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let nickname: String?
    let activePhotoId: String?
    let isLegacy: Bool
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case nickname
        case activePhotoId = "active_photo_id"
        case isLegacy = "is_legacy"
        case createdAt = "created_at"
    }

    var displayName: String {
        nickname?.isEmpty == false ? nickname! : name
    }

    static let previewParent = PropagationPlant(
        id: "plant-2",
        name: "Pothos",
        nickname: "Moss",
        activePhotoId: nil,
        isLegacy: false,
        createdAt: "2025-12-01T12:00:00Z"
    )

    static let previewChild = PropagationPlant(
        id: "plant-3",
        name: "Pothos Cutting",
        nickname: nil,
        activePhotoId: nil,
        isLegacy: false,
        createdAt: "2026-01-05T12:00:00Z"
    )
}

struct PropagationGroup: Equatable {
    let parentPlant: PropagationPlant?
    let childrenPlants: [PropagationPlant]
    let availableParents: [PropagationPlant]
}

struct PropagationDraft: Equatable {
    let name: String
    let nickname: String?
    let plantLocation: PlantLocation
    let location: String?
    let lightExposure: LightRequirement?
    let propagationDate: Date?
    let notes: String?
}
