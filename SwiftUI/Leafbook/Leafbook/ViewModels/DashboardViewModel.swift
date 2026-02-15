//
//  DashboardViewModel.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Foundation
import Observation
import WidgetKit

@Observable
@MainActor
final class DashboardViewModel {
    private(set) var summary: DashboardSummary
    private(set) var isLoading = false
    var errorMessage: String?

    private let service: SupabaseService

    init(service: SupabaseService = .shared, initialSummary: DashboardSummary = .empty) {
        self.service = service
        self.summary = initialSummary
    }

    func load(userId: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            async let profile = service.fetchDashboardProfile(userId: userId)
            async let plantCount = service.fetchActivePlantCount(userId: userId)
            async let wishlistCount = service.fetchWishlistCount(userId: userId)
            async let activeIssueCount = service.fetchActiveIssueCount(userId: userId)
            async let dueTasks = service.fetchDueTasks(userId: userId)
            async let scheduleSuggestions = service.fetchDashboardScheduleSuggestions(userId: userId)
            async let spotlightPlants = service.fetchDashboardSpotlightPlants(userId: userId)
            async let recentEntries = service.fetchJournalEntries(userId: userId, limit: 3)

            let dueTasksValue = try await dueTasks
            let recentEntriesValue = try await recentEntries

            let plantIdsForPhotos = Set(
                dueTasksValue.map { $0.plantId } +
                    recentEntriesValue.map { $0.plantId }
            )

            let photos = try await service.fetchPlantPhotos(plantIds: Array(plantIdsForPhotos))

            summary = DashboardSummary(
                profile: try await profile,
                activePlantCount: try await plantCount,
                wishlistCount: try await wishlistCount,
                activeIssueCount: try await activeIssueCount,
                dueTasks: dueTasksValue,
                scheduleSuggestions: try await scheduleSuggestions,
                spotlightPlants: try await spotlightPlants,
                recentJournalEntries: recentEntriesValue,
                plantPhotos: photos
            )
        } catch {
            errorMessage = "We couldn't load your dashboard yet."
        }
    }

    func logCareEvent(
        userId: String,
        plantId: String,
        eventType: TimelineEventType,
        eventDate: Date = Date()
    ) async -> Bool {
        do {
            try await service.createCareEvent(
                userId: userId,
                plantId: plantId,
                eventType: eventType,
                eventDate: eventDate
            )
            await load(userId: userId)
            WidgetCenter.shared.reloadAllTimelines()
            return true
        } catch {
            errorMessage = "We couldn't log that care task."
            return false
        }
    }

    func acceptSuggestion(userId: String, suggestionId: String) async -> Bool {
        do {
            try await service.acceptScheduleSuggestion(suggestionId: suggestionId)
            await load(userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't update that schedule suggestion."
            return false
        }
    }

    func dismissSuggestion(userId: String, suggestionId: String) async -> Bool {
        do {
            try await service.dismissScheduleSuggestion(suggestionId: suggestionId)
            await load(userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't update that schedule suggestion."
            return false
        }
    }
}
