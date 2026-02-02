//
//  PlantScheduleSuggestion.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import Foundation

struct PlantScheduleSuggestion: Identifiable, Codable, Equatable {
    let id: String
    let plantId: String
    let userId: String
    let suggestedIntervalDays: Int
    let currentIntervalDays: Int
    let confidenceScore: Double?
    let detectedAt: String?
    let dismissedAt: String?
    let acceptedAt: String?
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case plantId = "plant_id"
        case userId = "user_id"
        case suggestedIntervalDays = "suggested_interval_days"
        case currentIntervalDays = "current_interval_days"
        case confidenceScore = "confidence_score"
        case detectedAt = "detected_at"
        case dismissedAt = "dismissed_at"
        case acceptedAt = "accepted_at"
        case createdAt = "created_at"
    }

    static let preview = PlantScheduleSuggestion(
        id: "suggestion-1",
        plantId: "00000000-0000-0000-0000-000000000001",
        userId: "user-1",
        suggestedIntervalDays: 7,
        currentIntervalDays: 10,
        confidenceScore: 0.76,
        detectedAt: "2026-01-26T12:00:00Z",
        dismissedAt: nil,
        acceptedAt: nil,
        createdAt: "2026-01-26T12:00:00Z"
    )
}
