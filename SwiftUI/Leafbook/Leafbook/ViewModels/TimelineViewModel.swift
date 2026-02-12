//
//  TimelineViewModel.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/31/26.
//

import Foundation
import Observation

@Observable
@MainActor
final class TimelineViewModel {
    private(set) var events: [PlantEvent] = []
    private(set) var issues: [PlantIssue] = []
    private(set) var entries: [JournalEntry] = []
    private(set) var plants: [Plant] = []
    private(set) var pots: [PlantPot] = []
    private(set) var photosByPlantId: [String: [PlantPhoto]] = [:]
    private(set) var isLoading = false
    var errorMessage: String?

    private let service: SupabaseService
    let isPreview: Bool

    init(service: SupabaseService = .shared, isPreview: Bool = false) {
        self.service = service
        self.isPreview = isPreview
    }

    func load(userId: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            async let events = service.fetchTimelineEvents(userId: userId)
            async let issues = service.fetchTimelineIssues(userId: userId)
            async let entries = service.fetchJournalEntries(userId: userId, plantId: nil, limit: nil)
            async let plants = service.fetchActivePlants(userId: userId)
            async let pots = service.fetchUserPotsWithUsage(userId: userId)

            self.events = try await events
            self.issues = try await issues
            self.entries = try await entries
            self.plants = try await plants
            self.pots = try await pots.pots

            let plantIds = Set(
                self.events.compactMap(\.plantId)
                    + self.issues.compactMap(\.plantId)
                    + self.entries.map(\.plantId)
            )

            if plantIds.isEmpty {
                photosByPlantId = [:]
            } else {
                do {
                    let photos = try await service.fetchPlantPhotos(plantIds: Array(plantIds))
                    photosByPlantId = DashboardUtils.buildPhotosByPlant(photos)
                } catch {
                    print("TimelineViewModel: failed to load photos for plantIds=\(plantIds): \(error)")
                    photosByPlantId = [:]
                }
            }
        } catch {
            print("TimelineViewModel: failed to load timeline for userId=\(userId): \(error)")
            errorMessage = "We couldn't load your timeline yet."
        }
    }

    static func preview() -> TimelineViewModel {
        let viewModel = TimelineViewModel(isPreview: true)
        viewModel.events = [.preview]
        viewModel.issues = [.preview]
        viewModel.entries = [.preview]
        viewModel.plants = [.preview]
        viewModel.pots = [.preview]
        viewModel.photosByPlantId = DashboardUtils.buildPhotosByPlant([.preview])
        return viewModel
    }

    func thumbnailURL(for item: TimelineItem) -> URL? {
        guard let plantId = item.plantId else { return nil }
        return DashboardUtils.getThumbnailUrl(plantId: plantId, photosByPlant: photosByPlantId)
    }

    func updateCareEvent(
        userId: String,
        eventId: String,
        eventDate: Date,
        notes: String?
    ) async -> Bool {
        do {
            try await service.updateCareEvent(eventId: eventId, eventDate: eventDate, notes: notes)
            await load(userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't update that event."
            return false
        }
    }

    func updatePropagationEvent(
        userId: String,
        eventId: String,
        eventDate: Date,
        notes: String?,
        parentPlantId: String?
    ) async -> Bool {
        do {
            try await service.updatePropagationEvent(
                eventId: eventId,
                eventDate: eventDate,
                notes: notes,
                parentPlantId: parentPlantId
            )
            await load(userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't update that propagation."
            return false
        }
    }

    func updateRepotEvent(
        userId: String,
        plantId: String,
        eventId: String,
        eventDate: Date,
        fromPotId: String?,
        toPotId: String?
    ) async -> Bool {
        do {
            try await service.updateRepotEvent(
                eventId: eventId,
                eventDate: eventDate,
                fromPotId: fromPotId,
                toPotId: toPotId
            )
            try await service.updatePlantCurrentPot(plantId: plantId, potId: toPotId)
            await load(userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't update that repot."
            return false
        }
    }

    func updateMoveEvent(
        userId: String,
        plantId: String,
        event: PlantEvent,
        eventDate: Date,
        toLocation: String,
        notes: String?
    ) async -> Bool {
        do {
            try await service.updateMoveEvent(
                eventId: event.id,
                eventDate: eventDate,
                fromLocation: event.metadata?.fromLocation,
                toLocation: toLocation,
                notes: notes
            )
            let latestMoveEvent = try await service.fetchLatestMoveEvent(plantId: plantId)
            try await service.updatePlantLocation(plantId: plantId, location: latestMoveEvent?.metadata?.toLocation)
            await load(userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't update that move."
            return false
        }
    }

    func deleteEvent(userId: String, event: PlantEvent) async -> Bool {
        do {
            try await service.deletePlantEvent(eventId: event.id)
            if event.eventType == "moved", let plantId = event.plantId {
                let latestMoveEvent = try await service.fetchLatestMoveEvent(plantId: plantId)
                try await service.updatePlantLocation(plantId: plantId, location: latestMoveEvent?.metadata?.toLocation)
            }
            await load(userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't delete that event."
            return false
        }
    }
}
