//
//  JournalEntry.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Foundation

struct PlantSummary: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let plantTypeId: String?
    let plantTypes: PlantType?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case plantTypeId = "plant_type_id"
        case plantTypes = "plant_types"
    }

    static let preview = PlantSummary(
        id: "00000000-0000-0000-0000-000000000001",
        name: "Monstera",
        plantTypeId: "type-1",
        plantTypes: PlantType.preview
    )
}

struct JournalEntry: Identifiable, Codable, Equatable {
    let id: String
    let title: String?
    let content: String
    let entryDate: String
    let createdAt: String
    let eventId: String?
    let plantId: String
    let plant: PlantSummary

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case content
        case entryDate = "entry_date"
        case createdAt = "created_at"
        case eventId = "event_id"
        case plantId = "plant_id"
        case plant
    }

    static let preview = JournalEntry(
        id: "journal-1",
        title: "New leaf!",
        content: "Spotted a fresh fenestration today. Leaf unfurled overnight.",
        entryDate: "2026-01-20T12:00:00Z",
        createdAt: "2026-01-20T12:00:00Z",
        eventId: nil,
        plantId: "00000000-0000-0000-0000-000000000001",
        plant: PlantSummary.preview
    )
}
