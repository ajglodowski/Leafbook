//
//  LeafbookTests.swift
//  LeafbookTests
//
//  Created by AJ Glodowski on 1/26/26.
//

import Testing

struct LeafbookTests {
    private final class MockSupabaseService: SupabaseServicing {
        var plant: Plant
        var photos: [PlantPhoto]
        var journalEntries: [JournalEntry]
        var events: [PlantEvent]
        var issues: [PlantIssue]
        var dueTask: PlantDueTask?
        var carePreferences: PlantCarePreferences?
        var scheduleSuggestion: PlantScheduleSuggestion?
        var pots: [PlantPot]
        var activePlants: [(id: String, name: String, currentPotId: String?)]
        var parentPlant: PropagationPlant?
        var childrenPlants: [PropagationPlant]
        var availableParents: [PropagationPlant]
        var propagationPhotos: [PlantPhoto]

        init(
            plant: Plant,
            photos: [PlantPhoto] = [],
            journalEntries: [JournalEntry] = [],
            events: [PlantEvent] = [],
            issues: [PlantIssue] = [],
            dueTask: PlantDueTask? = nil,
            carePreferences: PlantCarePreferences? = nil,
            scheduleSuggestion: PlantScheduleSuggestion? = nil,
            pots: [PlantPot] = [],
            activePlants: [(id: String, name: String, currentPotId: String?)] = [],
            parentPlant: PropagationPlant? = nil,
            childrenPlants: [PropagationPlant] = [],
            availableParents: [PropagationPlant] = [],
            propagationPhotos: [PlantPhoto] = []
        ) {
            self.plant = plant
            self.photos = photos
            self.journalEntries = journalEntries
            self.events = events
            self.issues = issues
            self.dueTask = dueTask
            self.carePreferences = carePreferences
            self.scheduleSuggestion = scheduleSuggestion
            self.pots = pots
            self.activePlants = activePlants
            self.parentPlant = parentPlant
            self.childrenPlants = childrenPlants
            self.availableParents = availableParents
            self.propagationPhotos = propagationPhotos
        }

        func fetchPlantDetail(plantId: String, userId: String) async throws -> Plant { plant }
        func fetchPlantPhotos(plantId: String) async throws -> [PlantPhoto] { photos }
        func fetchPlantPhotos(plantIds: [String]) async throws -> [PlantPhoto] { propagationPhotos }
        func fetchJournalEntries(userId: String, plantId: String?, limit: Int?) async throws -> [JournalEntry] { journalEntries }
        func fetchPlantEvents(plantId: String) async throws -> [PlantEvent] { events }
        func fetchPlantIssues(plantId: String) async throws -> [PlantIssue] { issues }
        func fetchPlantDueTask(plantId: String) async throws -> PlantDueTask? { dueTask }
        func fetchPlantCarePreferences(plantId: String) async throws -> PlantCarePreferences? { carePreferences }
        func fetchPlantScheduleSuggestion(plantId: String) async throws -> PlantScheduleSuggestion? { scheduleSuggestion }
        func fetchUserPotsWithUsage(userId: String) async throws -> (pots: [PlantPot], activePlants: [(id: String, name: String, currentPotId: String?)]) {
            (pots, activePlants)
        }
        func fetchParentPlant(parentPlantId: String, userId: String) async throws -> PropagationPlant? { parentPlant }
        func fetchChildrenPlants(plantId: String, userId: String) async throws -> [PropagationPlant] { childrenPlants }
        func fetchPlantsForParentSelection(userId: String, currentPlantId: String) async throws -> [PropagationPlant] { availableParents }

        func createCareEvent(userId: String, plantId: String, eventType: String, eventDate: Date) async throws {}
        func createPlantIssue(userId: String, plantId: String, issueType: String, severity: String, description: String) async throws {}
        func updatePlantCarePreferences(plantId: String, wateringDays: Int?, fertilizingDays: Int?) async throws {}
        func updatePlantDetails(plantId: String, name: String, nickname: String?, plantLocation: String?, location: String?, lightExposure: String?, sizeCategory: String?, howAcquired: String?, description: String?, acquiredAt: Date?) async throws {}
        func updatePlantCurrentPot(plantId: String, potId: String?) async throws {}
        func acceptScheduleSuggestion(suggestionId: String) async throws {}
        func dismissScheduleSuggestion(suggestionId: String) async throws {}
        func createJournalEntry(userId: String, plantId: String, title: String?, content: String, entryDate: Date) async throws {}
    }

    private func makePlant(
        plantLocation: String?,
        activePhotoId: String? = nil,
        plantType: PlantType? = nil
    ) -> Plant {
        Plant(
            id: "plant-1",
            name: "Monstera",
            nickname: "Mona",
            plantLocation: plantLocation,
            location: "Living room",
            lightExposure: nil,
            sizeCategory: nil,
            isActive: true,
            isLegacy: false,
            legacyReason: nil,
            legacyAt: nil,
            createdAt: nil,
            acquiredAt: nil,
            howAcquired: nil,
            description: nil,
            plantTypeId: plantType?.id,
            activePhotoId: activePhotoId,
            currentPotId: nil,
            parentPlantId: nil,
            plantTypes: plantType
        )
    }


    @Test func example() async throws {
        // Write your test here and use APIs like `#expect(...)` to check expected conditions.
    }

    @Test func plantDisplayNamePrefersNickname() async throws {
        let plant = Plant(
            id: "plant-1",
            name: "Monstera",
            nickname: "Mona",
            plantLocation: nil,
            location: nil,
            lightExposure: nil,
            sizeCategory: nil,
            isActive: true,
            isLegacy: false,
            legacyReason: nil,
            legacyAt: nil,
            createdAt: nil,
            acquiredAt: nil,
            howAcquired: nil,
            description: nil,
            plantTypeId: nil,
            activePhotoId: nil,
            currentPotId: nil,
            parentPlantId: nil,
            plantTypes: nil
        )

        #expect(plant.displayName == "Mona")
    }

    @Test func dueTaskSummaryUsesStatuses() async throws {
        let task = PlantDueTask(plantId: "plant-1", wateringStatus: "due_soon", fertilizingStatus: "not_due")
        #expect(task.summary.contains("due soon"))
        #expect(task.summary.contains("not due"))
    }

    @Test func plantRowLocationBadgeDefaultsToIndoor() async throws {
        let model = PlantRowDisplayModel(plant: makePlant(plantLocation: nil), taskStatus: nil, thumbnailURL: nil)
        #expect(model.locationBadge.label == "Indoor")
        #expect(model.locationBadge.systemImage == "house.fill")
    }

    @Test func plantRowLocationBadgeOutdoor() async throws {
        let model = PlantRowDisplayModel(plant: makePlant(plantLocation: "outdoor"), taskStatus: nil, thumbnailURL: nil)
        #expect(model.locationBadge.label == "Outdoor")
        #expect(model.locationBadge.systemImage == "tree.fill")
    }

    @Test func plantRowTaskBadgesRespectSeverity() async throws {
        let task = PlantDueTask(plantId: "plant-1", wateringStatus: "overdue", fertilizingStatus: "due_soon")
        let model = PlantRowDisplayModel(plant: makePlant(plantLocation: "indoor"), taskStatus: task, thumbnailURL: nil)
        let expected = [
            PlantRowDisplayModel.TaskBadge(label: "Needs water", systemImage: "drop.fill", isCritical: true),
            PlantRowDisplayModel.TaskBadge(label: "Fertilize soon", systemImage: "sparkles", isCritical: false)
        ]
        #expect(model.taskBadges == expected)
    }

    @Test func plantRowThumbnailUsesActivePhotoId() async throws {
        let photo = PlantPhoto(
            id: "photo-1",
            plantId: "plant-1",
            url: "https://example.com/plant.jpg",
            caption: nil,
            takenAt: nil
        )
        let plant = makePlant(plantLocation: "indoor", activePhotoId: "photo-1")
        let url = PlantsViewModel.thumbnailURL(
            plant: plant,
            photosById: ["photo-1": photo],
            photosByPlantId: [:]
        )
        #expect(url?.absoluteString == photo.url)
    }

    @Test func plantRowThumbnailFallsBackToLatestPhoto() async throws {
        let photo = PlantPhoto(
            id: "photo-2",
            plantId: "plant-1",
            url: "https://example.com/latest.jpg",
            caption: nil,
            takenAt: nil
        )
        let plant = makePlant(plantLocation: "indoor", activePhotoId: nil)
        let url = PlantsViewModel.thumbnailURL(
            plant: plant,
            photosById: [:],
            photosByPlantId: ["plant-1": photo]
        )
        #expect(url?.absoluteString == photo.url)
    }

    @Test func plantDetailLoadPopulatesState() async throws {
        let plant = Plant.preview
        let pot = PlantPot.preview
        let parent = PropagationPlant.previewParent
        let child = PropagationPlant.previewChild
        let propagationPhoto = PlantPhoto(
            id: "photo-child",
            plantId: child.id,
            url: "https://example.com/child.jpg",
            caption: nil,
            takenAt: nil
        )

        let service = MockSupabaseService(
            plant: plant,
            photos: [.preview],
            journalEntries: [.preview],
            events: [.preview],
            issues: [.preview],
            dueTask: .preview,
            carePreferences: .preview,
            scheduleSuggestion: .preview,
            pots: [pot],
            activePlants: [(id: plant.id, name: plant.name, currentPotId: pot.id)],
            parentPlant: parent,
            childrenPlants: [child],
            availableParents: [parent],
            propagationPhotos: [propagationPhoto]
        )

        let viewModel = PlantDetailViewModel(service: service)
        await viewModel.load(plantId: plant.id, userId: "user-1")

        #expect(viewModel.plant.id == plant.id)
        #expect(viewModel.photos.count == 1)
        #expect(viewModel.journalEntries.count == 1)
        #expect(viewModel.events.count == 1)
        #expect(viewModel.issues.count == 1)
        #expect(viewModel.dueTask?.plantId == plant.id)
        #expect(viewModel.carePreferences?.wateringFrequencyDays == PlantCarePreferences.preview.wateringFrequencyDays)
        #expect(viewModel.scheduleSuggestion?.id == PlantScheduleSuggestion.preview.id)
        #expect(viewModel.currentPot?.id == pot.id)
        #expect(viewModel.propagationGroup.childrenPlants.count == 1)
        #expect(viewModel.propagationPhotosByPlantId[child.id]?.url == propagationPhoto.url)
    }

    @Test func plantDetailNeedsCareFlagsFromDueTask() async throws {
        var plant = Plant.preview
        plant = Plant(
            id: plant.id,
            name: plant.name,
            nickname: plant.nickname,
            plantLocation: plant.plantLocation,
            location: plant.location,
            lightExposure: plant.lightExposure,
            sizeCategory: plant.sizeCategory,
            isActive: plant.isActive,
            isLegacy: plant.isLegacy,
            legacyReason: plant.legacyReason,
            legacyAt: plant.legacyAt,
            createdAt: plant.createdAt,
            acquiredAt: plant.acquiredAt,
            howAcquired: plant.howAcquired,
            description: plant.description,
            plantTypeId: plant.plantTypeId,
            activePhotoId: plant.activePhotoId,
            currentPotId: plant.currentPotId,
            parentPlantId: plant.parentPlantId,
            plantTypes: plant.plantTypes
        )

        let task = PlantDueTask(plantId: plant.id, wateringStatus: "overdue", fertilizingStatus: "due_soon")
        let service = MockSupabaseService(plant: plant, dueTask: task)
        let viewModel = PlantDetailViewModel(service: service)

        await viewModel.load(plantId: plant.id, userId: "user-1")

        #expect(viewModel.needsWater == true)
        #expect(viewModel.needsFertilizer == true)
    }
}
