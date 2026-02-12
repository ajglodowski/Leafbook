//
//  PlantDueTask.swift
//  Leafbook
//
//  Shared with LeafbookWidget - keep in sync with Leafbook/Models/PlantDueTask.swift
//

import Foundation

enum TaskStatus: String, Codable, Equatable {
    case overdue = "overdue"
    case dueSoon = "due_soon"
    case notStarted = "not_started"
    case ok = "ok"
    case notDue = "not_due"
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
}
