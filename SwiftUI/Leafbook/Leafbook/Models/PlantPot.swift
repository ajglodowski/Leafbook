//
//  PlantPot.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import Foundation

struct PlantPot: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let sizeInches: Double?
    let material: String?
    let photoUrl: String?
    let isRetired: Bool?
    let hasDrainage: Bool?
    let color: String?
    let inUse: Bool?
    let usedByPlantId: String?
    let usedByPlantName: String?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case sizeInches = "size_inches"
        case material
        case photoUrl = "photo_url"
        case isRetired = "is_retired"
        case hasDrainage = "has_drainage"
        case color
        case inUse = "in_use"
        case usedByPlantId = "used_by_plant_id"
        case usedByPlantName = "used_by_plant_name"
    }

    static let preview = PlantPot(
        id: "pot-1",
        name: "Terracotta Pot",
        sizeInches: 8,
        material: "Clay",
        photoUrl: nil,
        isRetired: false,
        hasDrainage: true,
        color: "Terracotta",
        inUse: false,
        usedByPlantId: nil,
        usedByPlantName: nil
    )
}
