//
//  PlantCareTimelineProvider.swift
//  LeafbookWidget
//
//  Created by AJ Glodowski on 2/10/26.
//

import WidgetKit

struct PlantCareTimelineProvider: TimelineProvider {
    private let dataProvider = WidgetDataProvider()

    func placeholder(in context: Context) -> PlantCareTimelineEntry {
        .placeholder
    }

    func getSnapshot(in context: Context, completion: @escaping (PlantCareTimelineEntry) -> Void) {
        if context.isPreview {
            completion(.placeholder)
            return
        }
        Task {
            let entry = await fetchEntry()
            completion(entry)
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PlantCareTimelineEntry>) -> Void) {
        Task {
            let entry = await fetchEntry()
            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 2, to: Date()) ?? Date()
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }

    private func fetchEntry() async -> PlantCareTimelineEntry {
        guard let userId = UserDefaults(suiteName: SharedAuthStorage.suiteName)?.string(forKey: "widgetUserId") else {
            return PlantCareTimelineEntry(date: Date(), plants: [], isSignedOut: true)
        }

        do {
            let plants = try await dataProvider.fetchWidgetData(userId: userId)
            return PlantCareTimelineEntry(date: Date(), plants: plants, isSignedOut: false)
        } catch {
            return PlantCareTimelineEntry(date: Date(), plants: [], isSignedOut: false)
        }
    }
}
