//
//  PlantType.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Foundation

struct PlantType: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let scientificName: String?
    let wateringFrequencyDays: Int?
    let fertilizingFrequencyDays: Int?
    let lightMin: Int?
    let lightMax: Int?
    let description: String?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case scientificName = "scientific_name"
        case wateringFrequencyDays = "watering_frequency_days"
        case fertilizingFrequencyDays = "fertilizing_frequency_days"
        case lightMin = "light_min"
        case lightMax = "light_max"
        case description
    }

    init(
        id: String,
        name: String,
        scientificName: String?,
        wateringFrequencyDays: Int?,
        fertilizingFrequencyDays: Int?,
        lightMin: Int?,
        lightMax: Int?,
        description: String?
    ) {
        self.id = id
        self.name = name
        self.scientificName = scientificName
        self.wateringFrequencyDays = wateringFrequencyDays
        self.fertilizingFrequencyDays = fertilizingFrequencyDays
        self.lightMin = lightMin
        self.lightMax = lightMax
        self.description = description
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        scientificName = try container.decodeIfPresent(String.self, forKey: .scientificName)
        wateringFrequencyDays = try container.decodeIfPresent(Int.self, forKey: .wateringFrequencyDays)
        fertilizingFrequencyDays = try container.decodeIfPresent(Int.self, forKey: .fertilizingFrequencyDays)
        description = try container.decodeIfPresent(String.self, forKey: .description)

        lightMin = Self.decodeIntIfPresent(from: container, forKey: .lightMin)
        lightMax = Self.decodeIntIfPresent(from: container, forKey: .lightMax)
    }

    private static func decodeIntIfPresent(
        from container: KeyedDecodingContainer<CodingKeys>,
        forKey key: CodingKeys
    ) -> Int? {
        if let value = try? container.decodeIfPresent(Int.self, forKey: key) {
            return value
        }
        if let value = try? container.decodeIfPresent(String.self, forKey: key) {
            return Int(value.trimmingCharacters(in: .whitespacesAndNewlines))
        }
        return nil
    }

    static let preview = PlantType(
        id: "type-1",
        name: "Monstera deliciosa",
        scientificName: "Monstera deliciosa",
        wateringFrequencyDays: 10,
        fertilizingFrequencyDays: 30,
        lightMin: 4,
        lightMax: 8,
        description: "A hardy, holey-leaf classic."
    )
}
