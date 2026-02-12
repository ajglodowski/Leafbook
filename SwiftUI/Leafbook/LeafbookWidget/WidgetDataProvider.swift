//
//  WidgetDataProvider.swift
//  LeafbookWidget
//
//  Created by AJ Glodowski on 2/10/26.
//

import Foundation
import Supabase

struct WidgetDataProvider {
    private let client: SupabaseClient

    init() {
        client = SupabaseClient(
            supabaseURL: SupabaseConfiguration.supabaseURL,
            supabaseKey: SupabaseConfiguration.publishableKey,
            options: SupabaseClientOptions(
                auth: SupabaseClientOptions.AuthOptions(
                    storage: SharedAuthStorage(),
                    autoRefreshToken: false
                )
            )
        )
    }

    func fetchWidgetData(userId: String) async throws -> [WidgetPlantEntry] {
        // 1. Fetch all due tasks
        let tasks: [PlantDueTask] = try await client
            .from("v_plant_due_tasks")
            .select("""
                plant_id,
                plant_name,
                plant_type_name,
                watering_status,
                watering_frequency_days,
                last_watered_at,
                water_due_at,
                fertilizing_status,
                fertilizing_frequency_days,
                last_fertilized_at,
                fertilize_due_at
            """)
            .eq("user_id", value: userId)
            .execute()
            .value

        // 2. Prioritize: needs-attention first, then coming-this-week
        let needsAttention = tasks.filter { task in
            guard let status = task.wateringStatus else { return false }
            return status == .overdue || status == .dueSoon || status == .notStarted
        }

        let comingThisWeek = tasks.filter { task in
            guard let status = task.wateringStatus else { return false }
            guard status == .ok || status == .notDue else { return false }
            let daysUntil = DashboardUtils.getDaysUntilDue(task.waterDueAt)
            return daysUntil > 0 && daysUntil <= 7
        }.sorted {
            DashboardUtils.getDaysUntilDue($0.waterDueAt) < DashboardUtils.getDaysUntilDue($1.waterDueAt)
        }

        let selected = Array((needsAttention + comingThisWeek).prefix(3))
        guard !selected.isEmpty else { return [] }

        // 3. Fetch photos for selected plants
        let plantIds = selected.map { $0.plantId }
        let photos: [PlantPhoto] = try await client
            .from("plant_photos")
            .select("id, plant_id, url, caption, taken_at")
            .in("plant_id", values: plantIds)
            .order("taken_at", ascending: false)
            .execute()
            .value
        let photosByPlant = DashboardUtils.buildPhotosByPlant(photos)

        // 4. Download images (widgets can't use AsyncImage at render time)
        var entries: [WidgetPlantEntry] = []
        for task in selected {
            let imageURL = DashboardUtils.getThumbnailUrl(plantId: task.plantId, photosByPlant: photosByPlant)
            let imageData = await downloadImage(url: imageURL)
            entries.append(WidgetPlantEntry(
                plantId: task.plantId,
                plantName: task.plantName,
                wateringStatus: task.wateringStatus ?? .notDue,
                lastWateredAt: task.lastWateredAt,
                waterDueAt: task.waterDueAt,
                imageData: imageData
            ))
        }
        return entries
    }

    private func downloadImage(url: URL?) async -> Data? {
        guard let url else { return nil }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            return data
        } catch {
            return nil
        }
    }
}
