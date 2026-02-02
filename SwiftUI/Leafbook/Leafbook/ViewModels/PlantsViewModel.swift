//
//  PlantsViewModel.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Combine
import Foundation

@MainActor
final class PlantsViewModel: ObservableObject {
    @Published private(set) var plants: [Plant] = []
    @Published private(set) var dueTasksByPlantId: [String: PlantDueTask] = [:]
    @Published private(set) var photosById: [String: PlantPhoto] = [:]
    @Published private(set) var photosByPlantId: [String: PlantPhoto] = [:]
    @Published private(set) var isLoading = false
    @Published var errorMessage: String?

    private let service: SupabaseService

    init(service: SupabaseService = .shared) {
        self.service = service
    }

    func load(userId: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let plants = try await service.fetchActivePlants(userId: userId)
            async let dueTasks = service.fetchDueTasks(userId: userId)

            let plantIds = plants.map { $0.id }
            let photos = try await service.fetchPlantPhotos(plantIds: plantIds)

            let resolvedTasks = try await dueTasks

            self.plants = plants
            self.dueTasksByPlantId = Dictionary(uniqueKeysWithValues: resolvedTasks.map { ($0.plantId, $0) })
            self.photosById = Dictionary(uniqueKeysWithValues: photos.map { ($0.id, $0) })
            self.photosByPlantId = Self.firstPhotosByPlantId(from: photos)
        } catch {
            print("Failed to load plants: \(error)")
            errorMessage = "We couldn't load your plants yet."
        }
    }

    func taskStatus(for plant: Plant) -> PlantDueTask? {
        dueTasksByPlantId[plant.id]
    }

    func thumbnailURL(for plant: Plant) -> URL? {
        Self.thumbnailURL(
            plant: plant,
            photosById: photosById,
            photosByPlantId: photosByPlantId
        )
    }

    static func thumbnailURL(
        plant: Plant,
        photosById: [String: PlantPhoto],
        photosByPlantId: [String: PlantPhoto]
    ) -> URL? {
        if let photoId = plant.activePhotoId,
           let photo = photosById[photoId],
           let url = URL(string: photo.url) {
            return url
        }

        guard let fallback = photosByPlantId[plant.id] else {
            return nil
        }
        return URL(string: fallback.url)
    }

    static func firstPhotosByPlantId(from photos: [PlantPhoto]) -> [String: PlantPhoto] {
        var byPlantId: [String: PlantPhoto] = [:]
        for photo in photos {
            if byPlantId[photo.plantId] == nil {
                byPlantId[photo.plantId] = photo
            }
        }
        return byPlantId
    }
}
