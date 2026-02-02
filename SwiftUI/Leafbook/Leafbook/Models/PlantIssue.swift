//
//  PlantIssue.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import Foundation

struct PlantIssue: Identifiable, Codable, Equatable {
    let id: String
    let plantId: String?
    let issueType: String
    let severity: String?
    let status: String
    let description: String?
    let startedAt: String?
    let resolvedAt: String?
    let resolutionNotes: String?
    let plant: PlantSummary?

    enum CodingKeys: String, CodingKey {
        case id
        case plantId = "plant_id"
        case issueType = "issue_type"
        case severity
        case status
        case description
        case startedAt = "started_at"
        case resolvedAt = "resolved_at"
        case resolutionNotes = "resolution_notes"
        case plant = "plants"
    }

    static let preview = PlantIssue(
        id: "issue-1",
        plantId: "00000000-0000-0000-0000-000000000001",
        issueType: "pests",
        severity: "medium",
        status: "active",
        description: "Spotted a few gnats on the soil.",
        startedAt: "2026-01-18T12:00:00Z",
        resolvedAt: nil,
        resolutionNotes: nil,
        plant: PlantSummary.preview
    )
}
