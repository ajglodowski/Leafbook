//
//  PlantCarePreferences.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import Foundation

struct PlantCarePreferences: Codable, Equatable {
    let plantId: String?
    let wateringFrequencyDays: Int?
    let fertilizingFrequencyDays: Int?

    enum CodingKeys: String, CodingKey {
        case plantId = "plant_id"
        case wateringFrequencyDays = "watering_frequency_days"
        case fertilizingFrequencyDays = "fertilizing_frequency_days"
    }

    static let preview = PlantCarePreferences(
        plantId: "00000000-0000-0000-0000-000000000001",
        wateringFrequencyDays: 10,
        fertilizingFrequencyDays: 30
    )
}
