//
//  PlantType.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Foundation

struct PlantType: Identifiable, Codable, Equatable, Hashable {
    let id: String
    let name: String
    let scientificName: String?
    let wateringFrequencyDays: Int?
    let fertilizingFrequencyDays: Int?
    let lightMin: String?
    let lightMax: String?
    let sizeMin: String?
    let sizeMax: String?
    let description: String?
    let taxonId: String?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case scientificName = "scientific_name"
        case wateringFrequencyDays = "watering_frequency_days"
        case fertilizingFrequencyDays = "fertilizing_frequency_days"
        case lightMin = "light_min"
        case lightMax = "light_max"
        case sizeMin = "size_min"
        case sizeMax = "size_max"
        case description
        case taxonId = "taxon_id"
    }

    init(
        id: String,
        name: String,
        scientificName: String?,
        wateringFrequencyDays: Int?,
        fertilizingFrequencyDays: Int?,
        lightMin: String?,
        lightMax: String?,
        sizeMin: String? = nil,
        sizeMax: String? = nil,
        description: String?,
        taxonId: String? = nil
    ) {
        self.id = id
        self.name = name
        self.scientificName = scientificName
        self.wateringFrequencyDays = wateringFrequencyDays
        self.fertilizingFrequencyDays = fertilizingFrequencyDays
        self.lightMin = lightMin
        self.lightMax = lightMax
        self.sizeMin = sizeMin
        self.sizeMax = sizeMax
        self.description = description
        self.taxonId = taxonId
    }

    static let preview = PlantType(
        id: "type-1",
        name: "Monstera deliciosa",
        scientificName: "Monstera deliciosa",
        wateringFrequencyDays: 10,
        fertilizingFrequencyDays: 30,
        lightMin: "medium_indirect",
        lightMax: "bright_indirect",
        sizeMin: "medium",
        sizeMax: "large",
        description: "A hardy, holey-leaf classic."
    )
}
