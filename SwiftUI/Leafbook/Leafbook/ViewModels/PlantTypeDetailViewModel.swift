//
//  PlantTypeDetailViewModel.swift
//  Leafbook
//

import Foundation
import Observation

@Observable
@MainActor
final class PlantTypeDetailViewModel {
    private(set) var plants: [Plant] = []
    private(set) var photos: [PlantTypePhoto] = []
    private(set) var photosByPlantId: [String: PlantPhoto] = [:]
    private(set) var photosById: [String: PlantPhoto] = [:]
    private(set) var isLoading = false
    private(set) var hasLoadedData = false
    var errorMessage: String?

    private let service: SupabaseServicing

    init(service: SupabaseServicing = SupabaseService.shared) {
        self.service = service
    }

    func load(plantTypeId: String, userId: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            async let plantsResult = service.fetchPlantsByType(plantTypeId: plantTypeId, userId: userId)
            async let photosResult = service.fetchPlantTypePhotos(plantTypeId: plantTypeId)
            plants = try await plantsResult
            photos = (try? await photosResult) ?? []
            hasLoadedData = true

            // Fetch thumbnails for all loaded plants
            let plantIds = plants.map(\.id)
            if !plantIds.isEmpty {
                let plantPhotos = (try? await service.fetchPlantPhotos(plantIds: plantIds)) ?? []
                photosById = Dictionary(uniqueKeysWithValues: plantPhotos.map { ($0.id, $0) })
                var byPlantId: [String: PlantPhoto] = [:]
                for photo in plantPhotos {
                    if byPlantId[photo.plantId] == nil {
                        byPlantId[photo.plantId] = photo
                    }
                }
                photosByPlantId = byPlantId
            }
        } catch {
            print("PlantTypeDetailViewModel: failed to fetch plants for typeId=\(plantTypeId): \(error)")
            errorMessage = "We couldn't load plants for this type."
        }
    }

    func thumbnailURL(for plant: Plant) -> URL? {
        if let photoId = plant.activePhotoId,
           let photo = photosById[photoId],
           let url = URL(string: photo.url) {
            return url
        }
        guard let fallback = photosByPlantId[plant.id] else { return nil }
        return URL(string: fallback.url)
    }
}
