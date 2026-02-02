//
//  PlantDueTask.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Foundation

enum TaskStatus: String, Codable, Equatable {
    case overdue = "overdue"
    case dueSoon = "due_soon"
    case notStarted = "not_started"
    case ok = "ok"
    case notDue = "not_due"

    var displayText: String {
        switch self {
        case .overdue: return "Overdue"
        case .dueSoon: return "Due soon"
        case .notStarted: return "Not tracked yet"
        case .ok, .notDue: return "All set"
        }
    }
}

struct PlantDueTask: Identifiable, Codable, Equatable {
    var id: String { plantId }

    let plantId: String
    let plantName: String
    let plantTypeName: String?
    let wateringStatus: TaskStatus?
    let wateringFrequencyDays: Int?
    let lastWateredAt: String?
    let waterDueAt: String?
    let fertilizingStatus: TaskStatus?
    let fertilizingFrequencyDays: Int?
    let lastFertilizedAt: String?
    let fertilizeDueAt: String?

    enum CodingKeys: String, CodingKey {
        case plantId = "plant_id"
        case plantName = "plant_name"
        case plantTypeName = "plant_type_name"
        case wateringStatus = "watering_status"
        case wateringFrequencyDays = "watering_frequency_days"
        case lastWateredAt = "last_watered_at"
        case waterDueAt = "water_due_at"
        case fertilizingStatus = "fertilizing_status"
        case fertilizingFrequencyDays = "fertilizing_frequency_days"
        case lastFertilizedAt = "last_fertilized_at"
        case fertilizeDueAt = "fertilize_due_at"
    }

    var summary: String {
        let watering = wateringStatus?.rawValue.replacingOccurrences(of: "_", with: " ") ?? "unknown"
        let fertilizing = fertilizingStatus?.rawValue.replacingOccurrences(of: "_", with: " ") ?? "unknown"
        return "Watering: \(watering) · Fertilizing: \(fertilizing)"
    }

    static let preview = PlantDueTask(
        plantId: "00000000-0000-0000-0000-000000000001",
        plantName: "Monstera",
        plantTypeName: "Monstera deliciosa",
        wateringStatus: .dueSoon,
        wateringFrequencyDays: 7,
        lastWateredAt: "2026-01-21T12:00:00Z",
        waterDueAt: "2026-01-28T12:00:00Z",
        fertilizingStatus: .ok,
        fertilizingFrequencyDays: 30,
        lastFertilizedAt: "2026-01-05T12:00:00Z",
        fertilizeDueAt: "2026-02-05T12:00:00Z"
    )
}
