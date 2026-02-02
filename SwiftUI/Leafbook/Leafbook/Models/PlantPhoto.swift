//
//  PlantPhoto.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
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

    static let preview = PlantPhoto(
        id: "photo-1",
        plantId: "00000000-0000-0000-0000-000000000001",
        url: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
        caption: "New leaf unfurled",
        takenAt: "2026-01-10T12:00:00Z"
    )
}
