//
//  DashboardModels.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/29/26.
//

import Foundation

struct DashboardProfile: Identifiable, Codable, Equatable {
    let id: String
    let displayName: String?

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
    }

    static let preview = DashboardProfile(id: "user-1", displayName: "Ari")
}

struct DashboardScheduleSuggestion: Identifiable, Codable, Equatable {
    let id: String
    let plantId: String
    let plantName: String
    let suggestedIntervalDays: Int
    let currentIntervalDays: Int
    let confidenceScore: Double?

    enum CodingKeys: String, CodingKey {
        case id
        case plantId = "plant_id"
        case plantName = "plant_name"
        case suggestedIntervalDays = "suggested_interval_days"
        case currentIntervalDays = "current_interval_days"
        case confidenceScore = "confidence_score"
    }

    static let preview = DashboardScheduleSuggestion(
        id: "suggestion-1",
        plantId: "00000000-0000-0000-0000-000000000001",
        plantName: "Monstera",
        suggestedIntervalDays: 7,
        currentIntervalDays: 10,
        confidenceScore: 0.76
    )
}

struct DashboardSpotlightPlant: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let nickname: String?
    let description: String?
    let howAcquired: String?
    let plantTypeName: String?
    let photoUrl: String?

    static let preview = DashboardSpotlightPlant(
        id: "00000000-0000-0000-0000-000000000001",
        name: "Monstera",
        nickname: "Mona",
        description: "Growing a new leaf near the window.",
        howAcquired: "Plant shop",
        plantTypeName: "Monstera deliciosa",
        photoUrl: PlantPhoto.preview.url
    )
}

struct DashboardUpcomingTask: Identifiable, Equatable {
    var id: String { task.plantId }
    let task: PlantDueTask
    let daysUntilWater: Int
}
