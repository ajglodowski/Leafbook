//
//  PlantEvent.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import Foundation

struct PlantEventMetadata: Codable, Equatable {
    let fromPotId: String?
    let toPotId: String?
    let fromPotName: String?
    let toPotName: String?
    let fromLocation: String?
    let toLocation: String?
    let parentPlantId: String?

    enum CodingKeys: String, CodingKey {
        case fromPotId = "from_pot_id"
        case toPotId = "to_pot_id"
        case fromPotName = "from_pot_name"
        case toPotName = "to_pot_name"
        case fromLocation = "from_location"
        case toLocation = "to_location"
        case parentPlantId = "parent_plant_id"
    }
}

struct PlantEvent: Identifiable, Codable, Equatable {
    let id: String
    let plantId: String?
    let eventType: TimelineEventType
    let eventDate: String
    let notes: String?
    let metadata: PlantEventMetadata?
    let plant: PlantSummary?

    enum CodingKeys: String, CodingKey {
        case id
        case plantId = "plant_id"
        case eventType = "event_type"
        case eventDate = "event_date"
        case notes
        case metadata
        case plant = "plants"
    }

    static let preview = PlantEvent(
        id: "event-1",
        plantId: "00000000-0000-0000-0000-000000000001",
        eventType: .watered,
        eventDate: "2026-01-22T12:00:00Z",
        notes: "Gave a thorough soak.",
        metadata: nil,
        plant: PlantSummary.preview
    )
}
