//
//  CatalogViewModel.swift
//  Leafbook
//

import Foundation
import Observation

@Observable
@MainActor
final class CatalogViewModel {
    private(set) var plantTypes: [PlantType] = []
    private(set) var primaryPhotosByTypeId: [String: PlantTypePhoto] = [:]
    private(set) var isLoading = false
    private(set) var hasLoadedData = false
    var searchText: String = ""
    var selectedLight: PlantLightLevel? = nil
    var selectedSize: PlantSize? = nil
    var errorMessage: String?

    private let pageSize = 24
    private(set) var displayedCount = 24

    private let service: SupabaseServicing

    init(service: SupabaseServicing = SupabaseService.shared) {
        self.service = service
    }

    // MARK: - Filtering

    var filteredPlantTypes: [PlantType] {
        var results = plantTypes

        let q = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        if !q.isEmpty {
            results = results.filter {
                $0.name.localizedCaseInsensitiveContains(q)
                || ($0.scientificName?.localizedCaseInsensitiveContains(q) ?? false)
                || ($0.description?.localizedCaseInsensitiveContains(q) ?? false)
            }
        }

        if let light = selectedLight {
            results = results.filter { type in
                guard let minLevel = PlantLightLevel.from(type.lightMin),
                      let maxLevel = PlantLightLevel.from(type.lightMax) else { return false }
                return minLevel <= light && light <= maxLevel
            }
        }

        if let size = selectedSize {
            results = results.filter { type in
                guard let minSize = PlantSize.from(type.sizeMin),
                      let maxSize = PlantSize.from(type.sizeMax) else { return false }
                return minSize <= size && size <= maxSize
            }
        }

        return results
    }

    // MARK: - Pagination

    var displayedPlantTypes: [PlantType] {
        Array(filteredPlantTypes.prefix(displayedCount))
    }

    var hasMore: Bool {
        displayedCount < filteredPlantTypes.count
    }

    func loadMore() {
        displayedCount += pageSize
    }

    func resetPagination() {
        displayedCount = pageSize
    }

    var hasActiveFilters: Bool {
        selectedLight != nil || selectedSize != nil
    }

    func clearFilters() {
        selectedLight = nil
        selectedSize = nil
        displayedCount = pageSize
    }

    // MARK: - Data loading

    func primaryPhotoURL(for plantType: PlantType) -> URL? {
        guard let urlString = primaryPhotosByTypeId[plantType.id]?.url,
              let url = URL(string: urlString) else { return nil }
        return url
    }

    func load() async {
        guard !hasLoadedData else { return }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            async let typesResult = service.fetchAllPlantTypes()
            async let photosResult = service.fetchPrimaryPhotosForAllPlantTypes()
            let types = try await typesResult
            let photos = (try? await photosResult) ?? []
            self.plantTypes = types
            self.primaryPhotosByTypeId = Dictionary(
                uniqueKeysWithValues: photos.map { ($0.plantTypeId, $0) }
            )
            self.hasLoadedData = true
        } catch {
            print("CatalogViewModel: load failed: \(error)")
            errorMessage = "Couldn't load the catalog right now."
        }
    }

    func refresh() async {
        hasLoadedData = false
        displayedCount = pageSize
        await load()
    }
}
