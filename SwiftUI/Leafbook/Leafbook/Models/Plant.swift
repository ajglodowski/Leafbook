//
//  Plant.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Foundation

struct Plant: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let nickname: String?
    let plantLocation: String?
    let location: String?
    let lightExposure: String?
    let sizeCategory: String?
    let isActive: Bool?
    let isLegacy: Bool?
    let legacyReason: String?
    let legacyAt: String?
    let createdAt: String?
    let acquiredAt: String?
    let howAcquired: String?
    let description: String?
    let plantTypeId: String?
    let activePhotoId: String?
    let currentPotId: String?
    let parentPlantId: String?
    let plantTypes: PlantType?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case nickname
        case plantLocation = "plant_location"
        case location
        case lightExposure = "light_exposure"
        case sizeCategory = "size_category"
        case isActive = "is_active"
        case isLegacy = "is_legacy"
        case legacyReason = "legacy_reason"
        case legacyAt = "legacy_at"
        case createdAt = "created_at"
        case acquiredAt = "acquired_at"
        case howAcquired = "how_acquired"
        case description
        case plantTypeId = "plant_type_id"
        case activePhotoId = "active_photo_id"
        case currentPotId = "current_pot_id"
        case parentPlantId = "parent_plant_id"
        case plantTypes = "plant_types"
    }

    var displayName: String {
        nickname?.isEmpty == false ? nickname! : name
    }

    static let preview = Plant(
        id: "00000000-0000-0000-0000-000000000001",
        name: "Monstera",
        nickname: "Mona",
        plantLocation: "indoor",
        location: "Living room",
        lightExposure: "bright_indirect",
        sizeCategory: "medium",
        isActive: true,
        isLegacy: false,
        legacyReason: nil,
        legacyAt: nil,
        createdAt: "2025-12-01T12:00:00Z",
        acquiredAt: "2025-11-15T12:00:00Z",
        howAcquired: "Plant shop",
        description: "Doing great in the corner by the window.",
        plantTypeId: "type-1",
        activePhotoId: "photo-1",
        currentPotId: nil,
        parentPlantId: nil,
        plantTypes: PlantType.preview
    )
}
