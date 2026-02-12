//
//  WidgetPlantEntry.swift
//  LeafbookWidget
//
//  Created by AJ Glodowski on 2/10/26.
//

import Foundation
import WidgetKit

struct WidgetPlantEntry: Identifiable {
    let plantId: String
    let plantName: String
    let wateringStatus: TaskStatus
    let lastWateredAt: String?
    let waterDueAt: String?
    let imageData: Data?

    var id: String { plantId }
}

struct PlantCareTimelineEntry: TimelineEntry {
    let date: Date
    let plants: [WidgetPlantEntry]
    let isSignedOut: Bool

    static let placeholder = PlantCareTimelineEntry(
        date: Date(),
        plants: [
            WidgetPlantEntry(
                plantId: "1", plantName: "Monstera Deliciosa",
                wateringStatus: .overdue,
                lastWateredAt: "2026-02-03T12:00:00Z",
                waterDueAt: "2026-02-07T12:00:00Z",
                imageData: nil
            ),
            WidgetPlantEntry(
                plantId: "2", plantName: "Golden Pothos",
                wateringStatus: .dueSoon,
                lastWateredAt: "2026-02-08T12:00:00Z",
                waterDueAt: "2026-02-11T12:00:00Z",
                imageData: nil
            ),
            WidgetPlantEntry(
                plantId: "3", plantName: "Snake Plant",
                wateringStatus: .ok,
                lastWateredAt: "2026-02-09T12:00:00Z",
                waterDueAt: "2026-02-14T12:00:00Z",
                imageData: nil
            ),
        ],
        isSignedOut: false
    )

    static let signedOut = PlantCareTimelineEntry(
        date: Date(),
        plants: [],
        isSignedOut: true
    )

    static let allCaughtUp = PlantCareTimelineEntry(
        date: Date(),
        plants: [],
        isSignedOut: false
    )
}
