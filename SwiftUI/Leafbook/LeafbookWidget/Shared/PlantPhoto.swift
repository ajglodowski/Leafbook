//
//  PlantPhoto.swift
//  Leafbook
//
//  Shared with LeafbookWidget - keep in sync with Leafbook/Models/PlantPhoto.swift
//

import Foundation

struct PlantPhoto: Identifiable, Codable, Equatable {
    let id: String
    let plantId: String
    let url: String
    let caption: String?
    let takenAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case plantId = "plant_id"
        case url
        case caption
        case takenAt = "taken_at"
    }
}
