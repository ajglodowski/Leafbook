//
//  SupabaseServicing.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import Foundation

protocol SupabaseServicing: Sendable {
    func fetchDashboardProfile(userId: String) async throws -> DashboardProfile?
    func fetchActivePlantCount(userId: String) async throws -> Int
    func fetchWishlistCount(userId: String) async throws -> Int
    func fetchActiveIssueCount(userId: String) async throws -> Int
    func fetchDueTasks(userId: String) async throws -> [PlantDueTask]
    func fetchDashboardScheduleSuggestions(userId: String) async throws -> [DashboardScheduleSuggestion]
    func fetchDashboardSpotlightPlants(userId: String) async throws -> [DashboardSpotlightPlant]
    func fetchJournalEntries(userId: String, plantId: String?, limit: Int?) async throws -> [JournalEntry]
    func fetchTimelineEvents(userId: String) async throws -> [PlantEvent]
    func fetchTimelineIssues(userId: String) async throws -> [PlantIssue]
    func fetchPlantDetail(plantId: String, userId: String) async throws -> Plant
    func fetchPlantPhotos(plantId: String) async throws -> [PlantPhoto]
    func fetchPlantPhotos(plantIds: [String]) async throws -> [PlantPhoto]
    func fetchPlantEvents(plantId: String) async throws -> [PlantEvent]
    func fetchPlantIssues(plantId: String) async throws -> [PlantIssue]
    func fetchPlantDueTask(plantId: String) async throws -> PlantDueTask?
    func fetchPlantCarePreferences(plantId: String) async throws -> PlantCarePreferences?
    func fetchPlantScheduleSuggestion(plantId: String) async throws -> PlantScheduleSuggestion?
    func fetchUserPotsWithUsage(userId: String) async throws -> (pots: [PlantPot], activePlants: [(id: String, name: String, currentPotId: String?)])
    func fetchParentPlant(parentPlantId: String, userId: String) async throws -> PropagationPlant?
    func fetchChildrenPlants(plantId: String, userId: String) async throws -> [PropagationPlant]
    func fetchPlantsForParentSelection(userId: String, currentPlantId: String) async throws -> [PropagationPlant]
    func fetchLatestMoveEvent(plantId: String) async throws -> PlantEvent?

    func createCareEvent(userId: String, plantId: String, eventType: TimelineEventType, eventDate: Date) async throws
    func createMoveEvent(
        userId: String,
        plantId: String,
        eventDate: Date,
        fromLocation: String?,
        toLocation: String,
        notes: String?
    ) async throws
    func createRepotEvent(
        userId: String,
        plantId: String,
        eventDate: Date,
        fromPotId: String?,
        toPotId: String?
    ) async throws
    func updateMoveEvent(
        eventId: String,
        eventDate: Date,
        fromLocation: String?,
        toLocation: String,
        notes: String?
    ) async throws
    func updateCareEvent(eventId: String, eventDate: Date, notes: String?) async throws
    func updatePropagationEvent(
        eventId: String,
        eventDate: Date,
        notes: String?,
        parentPlantId: String?
    ) async throws
    func updateRepotEvent(
        eventId: String,
        eventDate: Date,
        fromPotId: String?,
        toPotId: String?
    ) async throws
    func deletePlantEvent(eventId: String) async throws
    func createPlantIssue(userId: String, plantId: String, issueType: IssueType, severity: IssueSeverity, description: String) async throws
    func resolvePlantIssue(issueId: String, resolutionNotes: String?) async throws
    func updatePlantPhotoMetadata(photoId: String, takenAt: Date, caption: String?) async throws
    func uploadPlantPhoto(plantId: String, imageData: Data, takenAt: Date?, caption: String?) async throws -> PlantPhoto
    func updatePlantCarePreferences(plantId: String, wateringDays: Int?, fertilizingDays: Int?) async throws
    func updatePlantDetails(
        plantId: String,
        name: String,
        nickname: String?,
        plantLocation: PlantLocation?,
        location: String?,
        lightExposure: LightRequirement?,
        sizeCategory: SizeCategory?,
        howAcquired: String?,
        description: String?,
        acquiredAt: Date?,
        parentPlantId: String?
    ) async throws
    func setParentPlant(
        childPlantId: String,
        parentPlantId: String,
        userId: String,
        propagationDate: Date?
    ) async throws
    func clearParentPlant(childPlantId: String, userId: String) async throws
    func createPropagatedPlant(
        userId: String,
        parentPlantId: String,
        name: String,
        nickname: String?,
        plantTypeId: String?,
        plantLocation: PlantLocation,
        location: String?,
        lightExposure: LightRequirement?,
        propagationDate: Date?,
        description: String?
    ) async throws -> Plant
    func createAcquiredEvent(userId: String, plantId: String) async throws
    func updatePlantCurrentPot(plantId: String, potId: String?) async throws
    func updatePlantLocation(plantId: String, location: String?) async throws
    func acceptScheduleSuggestion(suggestionId: String) async throws
    func dismissScheduleSuggestion(suggestionId: String) async throws
    func createJournalEntry(
        userId: String,
        plantId: String,
        title: String?,
        content: String,
        entryDate: Date,
        eventId: String?
    ) async throws
    func deleteJournalEntry(entryId: String, userId: String) async throws
    func markPlantAsLegacy(plantId: String, userId: String, reason: String) async throws
    func restorePlantFromLegacy(plantId: String, userId: String) async throws
    func createLegacyEvent(userId: String, plantId: String, reason: String?) async throws

    func fetchAllTaxa() async throws -> [Taxon]
    func fetchAllTaxonEdges() async throws -> [TaxonEdge]

    func fetchPlantsByType(plantTypeId: String, userId: String) async throws -> [Plant]
    func fetchPlantTypePhotos(plantTypeId: String) async throws -> [PlantTypePhoto]

    func fetchAllPlantTypes() async throws -> [PlantType]
    func fetchPrimaryPhotosForAllPlantTypes() async throws -> [PlantTypePhoto]
}
