//
//  PlantsViewModel.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Foundation
import Observation

@Observable
@MainActor
final class PlantsViewModel {
    private(set) var plants: [Plant] = []
    private(set) var legacyPlants: [Plant] = []
    private(set) var dueTasksByPlantId: [String: PlantDueTask] = [:]
    private(set) var photosById: [String: PlantPhoto] = [:]
    private(set) var photosByPlantId: [String: PlantPhoto] = [:]
    private(set) var isLoading = false
    var errorMessage: String?

    private let service: SupabaseService

    init(service: SupabaseService = .shared) {
        self.service = service
    }

    func load(userId: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            async let plantsResult = service.fetchActivePlants(userId: userId)
            async let legacyPlantsResult = service.fetchLegacyPlants(userId: userId)
            async let dueTasks = service.fetchDueTasks(userId: userId)

            let plants = try await plantsResult
            let legacyPlants = try await legacyPlantsResult
            let plantIds = (plants + legacyPlants).map { $0.id }
            let photos = try await service.fetchPlantPhotos(plantIds: plantIds)

            let resolvedTasks = try await dueTasks

            self.plants = plants
            self.legacyPlants = legacyPlants
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
