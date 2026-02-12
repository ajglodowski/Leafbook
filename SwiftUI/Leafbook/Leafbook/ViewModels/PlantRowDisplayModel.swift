//
//  PlantRowDisplayModel.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import Foundation

struct PlantRowDisplayModel: Equatable {
    struct LocationBadge: Equatable {
        let label: String
        let systemImage: String
    }

    struct TaskBadge: Equatable {
        let label: String
        let systemImage: String
        let isCritical: Bool
    }

    let name: String
    let nickname: String?
    let plantTypeName: String?
    let scientificName: String?
    let locationLine: String?
    let locationBadge: LocationBadge
    let taskBadges: [TaskBadge]
    let thumbnailURL: URL?
    let isLegacy: Bool
    let legacyReason: String?
    let legacyDateText: String?

    init(plant: Plant, taskStatus: PlantDueTask?, thumbnailURL: URL?) {
        self.name = plant.name
        self.nickname = PlantRowDisplayModel.normalizedText(plant.nickname)
        self.plantTypeName = PlantRowDisplayModel.normalizedText(plant.plantTypes?.name)
        self.scientificName = PlantRowDisplayModel.normalizedText(plant.plantTypes?.scientificName)
        self.locationLine = PlantRowDisplayModel.normalizedText(plant.location)
        self.locationBadge = PlantRowDisplayModel.locationBadge(from: plant.plantLocation)
        self.taskBadges = PlantRowDisplayModel.taskBadges(from: taskStatus)
        self.thumbnailURL = thumbnailURL
        self.isLegacy = plant.isLegacy ?? false
        self.legacyReason = PlantRowDisplayModel.normalizedText(plant.legacyReason)
        self.legacyDateText = PlantRowDisplayModel.formattedLegacyDate(from: plant.legacyAt)
    }

    static func locationBadge(from plantLocation: String?) -> LocationBadge {
        if plantLocation == "outdoor" {
            return LocationBadge(label: "Outdoor", systemImage: "tree.fill")
        }
        return LocationBadge(label: "Indoor", systemImage: "house.fill")
    }

    static func taskBadges(from taskStatus: PlantDueTask?) -> [TaskBadge] {
        guard let taskStatus else { return [] }
        var badges: [TaskBadge] = []

        if taskStatus.wateringStatus == .overdue {
            badges.append(TaskBadge(label: "Needs water", systemImage: "drop.fill", isCritical: true))
        } else if taskStatus.wateringStatus == .dueSoon {
            badges.append(TaskBadge(label: "Water soon", systemImage: "drop.fill", isCritical: false))
        }

        if taskStatus.fertilizingStatus == .overdue {
            badges.append(TaskBadge(label: "Needs fertilizer", systemImage: "sparkles", isCritical: true))
        } else if taskStatus.fertilizingStatus == .dueSoon {
            badges.append(TaskBadge(label: "Fertilize soon", systemImage: "sparkles", isCritical: false))
        }

        return badges
    }

    private static func normalizedText(_ value: String?) -> String? {
        guard let value = value?.trimmingCharacters(in: .whitespacesAndNewlines),
              !value.isEmpty else {
            return nil
        }
        return value
    }

    private static func formattedLegacyDate(from value: String?) -> String? {
        guard let value else { return nil }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        var date = formatter.date(from: value)
        if date == nil {
            formatter.formatOptions = [.withInternetDateTime]
            date = formatter.date(from: value)
        }
        guard let resolvedDate = date else { return nil }
        let outputFormatter = DateFormatter()
        outputFormatter.locale = Locale(identifier: "en_US_POSIX")
        outputFormatter.dateFormat = "MMM d, yyyy"
        return outputFormatter.string(from: resolvedDate)
    }
}
