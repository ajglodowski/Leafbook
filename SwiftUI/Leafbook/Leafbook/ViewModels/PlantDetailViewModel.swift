//
//  PlantDetailViewModel.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Foundation
import Observation

@Observable
@MainActor
final class PlantDetailViewModel {
    private(set) var plant: Plant = .preview
    private(set) var photos: [PlantPhoto] = []
    private(set) var journalEntries: [JournalEntry] = []
    private(set) var events: [PlantEvent] = []
    private(set) var issues: [PlantIssue] = []
    private(set) var dueTask: PlantDueTask?
    private(set) var carePreferences: PlantCarePreferences?
    private(set) var scheduleSuggestion: PlantScheduleSuggestion?
    private(set) var pots: [PlantPot] = []
    private(set) var propagationGroup = PropagationGroup(parentPlant: nil, childrenPlants: [], availableParents: [])
    private(set) var propagationPhotosByPlantId: [String: PlantPhoto] = [:]
    private(set) var isLoading = false
    private(set) var hasLoadedData = false
    var errorMessage: String?

    private let service: SupabaseServicing

    init(service: SupabaseServicing = SupabaseService.shared) {
        self.service = service
    }

    var isLegacy: Bool {
        plant.isLegacy ?? false
    }

    var activeIssues: [PlantIssue] {
        issues.filter { $0.status == .active }
    }

    var needsWater: Bool {
        let status = dueTask?.wateringStatus
        return status == .overdue || status == .dueSoon || status == .notStarted
    }

    var needsFertilizer: Bool {
        let status = dueTask?.fertilizingStatus
        return status == .overdue || status == .dueSoon
    }

    var currentPot: PlantPot? {
        guard let potId = plant.currentPotId else { return nil }
        return pots.first { $0.id == potId }
    }

    var unusedPots: [PlantPot] {
        pots.filter { ($0.isRetired ?? false) == false && ($0.inUse ?? false) == false }
    }

    var hasCustomCare: Bool {
        (carePreferences?.wateringFrequencyDays ?? 0) > 0 || (carePreferences?.fertilizingFrequencyDays ?? 0) > 0
    }

    var heroPhoto: PlantPhoto? {
        if let activePhotoId = plant.activePhotoId,
           let activePhoto = photos.first(where: { $0.id == activePhotoId && !$0.url.isEmpty }) {
            return activePhoto
        }
        return photos.first(where: { !$0.url.isEmpty })
    }

    func load(plantId: String, userId: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        guard UUID(uuidString: plantId) != nil else {
            print("PlantDetailViewModel: invalid plantId \(plantId)")
            errorMessage = "We couldn't load this plant yet."
            return
        }

        do {
            let plant = try await service.fetchPlantDetail(plantId: plantId, userId: userId)

            async let photos: [PlantPhoto] = {
                do {
                    return try await service.fetchPlantPhotos(plantId: plantId)
                } catch {
                    print("PlantDetailViewModel: failed to fetch photos: \(error)")
                    return []
                }
            }()
            async let journalEntries: [JournalEntry] = {
                do {
                    return try await service.fetchJournalEntries(userId: userId, plantId: plantId, limit: 5)
                } catch {
                    print("PlantDetailViewModel: failed to fetch journal entries: \(error)")
                    return []
                }
            }()
            async let events: [PlantEvent] = {
                do {
                    return try await service.fetchPlantEvents(plantId: plantId)
                } catch {
                    print("PlantDetailViewModel: failed to fetch events: \(error)")
                    return []
                }
            }()
            async let issues: [PlantIssue] = {
                do {
                    return try await service.fetchPlantIssues(plantId: plantId)
                } catch {
                    print("PlantDetailViewModel: failed to fetch issues: \(error)")
                    return []
                }
            }()
            async let dueTask: PlantDueTask? = {
                do {
                    return try await service.fetchPlantDueTask(plantId: plantId)
                } catch {
                    print("PlantDetailViewModel: failed to fetch due task: \(error)")
                    return nil
                }
            }()
            async let carePreferences: PlantCarePreferences? = {
                do {
                    return try await service.fetchPlantCarePreferences(plantId: plantId)
                } catch {
                    print("PlantDetailViewModel: failed to fetch care preferences: \(error)")
                    return nil
                }
            }()
            async let scheduleSuggestion: PlantScheduleSuggestion? = {
                do {
                    return try await service.fetchPlantScheduleSuggestion(plantId: plantId)
                } catch {
                    print("PlantDetailViewModel: failed to fetch schedule suggestion: \(error)")
                    return nil
                }
            }()
            async let potsResult: (pots: [PlantPot], activePlants: [(id: String, name: String, currentPotId: String?)]) = {
                do {
                    return try await service.fetchUserPotsWithUsage(userId: userId)
                } catch {
                    print("PlantDetailViewModel: failed to fetch pots: \(error)")
                    return (pots: [], activePlants: [])
                }
            }()

            async let parentPlant: PropagationPlant? = {
                guard let parentId = plant.parentPlantId else { return nil }
                do {
                    return try await service.fetchParentPlant(parentPlantId: parentId, userId: userId)
                } catch {
                    print("PlantDetailViewModel: failed to fetch parent plant: \(error)")
                    return nil
                }
            }()
            async let childrenPlants: [PropagationPlant] = {
                do {
                    return try await service.fetchChildrenPlants(plantId: plantId, userId: userId)
                } catch {
                    print("PlantDetailViewModel: failed to fetch children plants: \(error)")
                    return []
                }
            }()
            async let availableParents: [PropagationPlant] = {
                do {
                    return try await service.fetchPlantsForParentSelection(userId: userId, currentPlantId: plantId)
                } catch {
                    print("PlantDetailViewModel: failed to fetch available parents: \(error)")
                    return []
                }
            }()

            let resolvedParent = await parentPlant
            let resolvedChildren = await childrenPlants
            let resolvedAvailableParents = await availableParents
            let propagationIds = [resolvedParent?.id]
                .compactMap { $0 }
                .filter { !$0.isEmpty }
                + resolvedChildren.map { $0.id }

            let propagationPhotos = await {
                do {
                    return try await service.fetchPlantPhotos(plantIds: propagationIds)
                } catch {
                    print("PlantDetailViewModel: failed to fetch propagation photos: \(error)")
                    return []
                }
            }()
            let propagationPhotoMap = Dictionary(grouping: propagationPhotos, by: { $0.plantId })
                .compactMapValues { $0.first }
            let (pots, activePlants) = await potsResult

            self.plant = plant
            self.photos = await photos
            self.journalEntries = await journalEntries
            self.events = await events
            self.issues = await issues
            self.dueTask = await dueTask
            self.carePreferences = await carePreferences
            self.scheduleSuggestion = await scheduleSuggestion
            self.pots = Self.potsWithUsage(pots: pots, activePlants: activePlants)
            self.propagationGroup = PropagationGroup(
                parentPlant: resolvedParent,
                childrenPlants: resolvedChildren,
                availableParents: resolvedAvailableParents
            )
            self.propagationPhotosByPlantId = propagationPhotoMap
            self.hasLoadedData = true
        } catch {
            print("PlantDetailViewModel: FAILED to fetch plant detail: \(error)")
            errorMessage = "We couldn't load this plant yet."
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
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't log that care event."
            return false
        }
    }

    func createAcquiredEvent(userId: String, plantId: String) async -> Bool {
        do {
            try await service.createAcquiredEvent(userId: userId, plantId: plantId)
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't add that acquired event."
            return false
        }
    }

    func saveCarePreferences(plantId: String, userId: String, wateringDays: Int?, fertilizingDays: Int?) async -> Bool {
        do {
            try await service.updatePlantCarePreferences(plantId: plantId, wateringDays: wateringDays, fertilizingDays: fertilizingDays)
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't update care preferences."
            return false
        }
    }

    func updatePhotoMetadata(userId: String, photoId: String, takenAt: Date, caption: String?) async -> String? {
        do {
            try await service.updatePlantPhotoMetadata(photoId: photoId, takenAt: takenAt, caption: caption)
            await load(plantId: plant.id, userId: userId)
            return nil
        } catch {
            print("PlantDetailViewModel: failed to update photo metadata: \(error)")
            errorMessage = "We couldn't update that photo."
            return "We couldn't update that photo."
        }
    }

    func uploadPhoto(userId: String, plantId: String, imageData: Data, takenAt: Date, caption: String?) async -> String? {
        do {
            _ = try await service.uploadPlantPhoto(
                plantId: plantId,
                imageData: imageData,
                takenAt: takenAt,
                caption: caption
            )
            await load(plantId: plantId, userId: userId)
            return nil
        } catch {
            print("PlantDetailViewModel: failed to upload photo: \(error)")
            errorMessage = "We couldn't upload that photo."
            return "We couldn't upload that photo."
        }
    }

    func savePlantEdits(
        plantId: String,
        userId: String,
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
    ) async -> Bool {
        do {
            try await service.updatePlantDetails(
                plantId: plantId,
                name: name,
                nickname: nickname,
                plantLocation: plantLocation,
                location: location,
                lightExposure: lightExposure,
                sizeCategory: sizeCategory,
                howAcquired: howAcquired,
                description: description,
                acquiredAt: acquiredAt,
                parentPlantId: parentPlantId
            )
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't update that plant."
            return false
        }
    }

    func setParentPlant(
        userId: String,
        plantId: String,
        parentPlantId: String,
        propagationDate: Date?
    ) async -> Bool {
        do {
            try await service.setParentPlant(
                childPlantId: plantId,
                parentPlantId: parentPlantId,
                userId: userId,
                propagationDate: propagationDate
            )
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't set that parent plant."
            return false
        }
    }

    func clearParentPlant(userId: String, plantId: String) async -> Bool {
        do {
            try await service.clearParentPlant(childPlantId: plantId, userId: userId)
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't remove that parent plant."
            return false
        }
    }

    func createPropagatedPlant(
        userId: String,
        plantId: String,
        parentPlantId: String,
        plantTypeId: String?,
        draft: PropagationDraft
    ) async -> String? {
        do {
            let trimmedName = draft.name.trimmingCharacters(in: .whitespacesAndNewlines)
            let trimmedNickname = draft.nickname?.trimmingCharacters(in: .whitespacesAndNewlines)
            let trimmedLocation = draft.location?.trimmingCharacters(in: .whitespacesAndNewlines)
            let trimmedNotes = draft.notes?.trimmingCharacters(in: .whitespacesAndNewlines)
            let plant = try await service.createPropagatedPlant(
                userId: userId,
                parentPlantId: parentPlantId,
                name: trimmedName,
                nickname: trimmedNickname?.isEmpty == true ? nil : trimmedNickname,
                plantTypeId: plantTypeId,
                plantLocation: draft.plantLocation,
                location: trimmedLocation?.isEmpty == true ? nil : trimmedLocation,
                lightExposure: draft.lightExposure,
                propagationDate: draft.propagationDate,
                description: trimmedNotes?.isEmpty == true ? nil : trimmedNotes
            )
            await load(plantId: plantId, userId: userId)
            return plant.id
        } catch {
            errorMessage = "We couldn't create that propagation."
            return nil
        }
    }

    func addIssue(userId: String, plantId: String, issueType: IssueType, severity: IssueSeverity, description: String) async -> Bool {
        do {
            try await service.createPlantIssue(userId: userId, plantId: plantId, issueType: issueType, severity: severity, description: description)
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't add that issue."
            return false
        }
    }

    func resolveIssue(userId: String, plantId: String, issueId: String, resolutionNotes: String?) async -> Bool {
        do {
            try await service.resolvePlantIssue(issueId: issueId, resolutionNotes: resolutionNotes)
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't resolve that issue."
            return false
        }
    }

    func repotPlant(userId: String, plantId: String, potId: String?) async -> Bool {
        do {
            let fromPotId = plant.currentPotId
            try await service.updatePlantCurrentPot(plantId: plantId, potId: potId)
            try await service.createRepotEvent(
                userId: userId,
                plantId: plantId,
                eventDate: Date(),
                fromPotId: fromPotId,
                toPotId: potId
            )
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't update that pot."
            return false
        }
    }

    func movePlant(
        userId: String,
        plantId: String,
        eventDate: Date,
        toLocation: String,
        notes: String?
    ) async -> Bool {
        do {
            try await service.createMoveEvent(
                userId: userId,
                plantId: plantId,
                eventDate: eventDate,
                fromLocation: plant.location,
                toLocation: toLocation,
                notes: notes
            )
            try await service.updatePlantLocation(plantId: plantId, location: toLocation)
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't update that location."
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
                fromLocation: event.metadata?.fromLocation ?? plant.location,
                toLocation: toLocation,
                notes: notes
            )
            let latestMoveEvent = try await service.fetchLatestMoveEvent(plantId: plantId)
            try await service.updatePlantLocation(plantId: plantId, location: latestMoveEvent?.metadata?.toLocation)
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't update that move."
            return false
        }
    }

    func updateCareEvent(
        userId: String,
        plantId: String,
        eventId: String,
        eventDate: Date,
        notes: String?
    ) async -> Bool {
        do {
            try await service.updateCareEvent(eventId: eventId, eventDate: eventDate, notes: notes)
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't update that event."
            return false
        }
    }

    func updatePropagationEvent(
        userId: String,
        plantId: String,
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
            await load(plantId: plantId, userId: userId)
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
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't update that repot."
            return false
        }
    }

    func deleteEvent(userId: String, plantId: String, event: PlantEvent) async -> Bool {
        do {
            try await service.deletePlantEvent(eventId: event.id)
            if event.eventType == .moved {
                let latestMoveEvent = try await service.fetchLatestMoveEvent(plantId: plantId)
                try await service.updatePlantLocation(plantId: plantId, location: latestMoveEvent?.metadata?.toLocation)
            }
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't delete that event."
            return false
        }
    }

    func acceptSuggestion(userId: String, plantId: String, suggestionId: String) async -> Bool {
        do {
            try await service.acceptScheduleSuggestion(suggestionId: suggestionId)
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't accept that suggestion."
            return false
        }
    }

    func dismissSuggestion(userId: String, plantId: String, suggestionId: String) async -> Bool {
        do {
            try await service.dismissScheduleSuggestion(suggestionId: suggestionId)
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't dismiss that suggestion."
            return false
        }
    }

    func createJournalEntry(
        userId: String,
        plantId: String,
        title: String?,
        content: String,
        entryDate: Date,
        eventId: String?
    ) async -> Bool {
        do {
            try await service.createJournalEntry(
                userId: userId,
                plantId: plantId,
                title: title,
                content: content,
                entryDate: entryDate,
                eventId: eventId
            )
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't save that journal entry."
            return false
        }
    }

    func markAsLegacy(userId: String, plantId: String, reason: String) async -> Bool {
        do {
            try await service.markPlantAsLegacy(plantId: plantId, userId: userId, reason: reason)
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't mark this plant as legacy."
            return false
        }
    }

    func createLegacyEvent(userId: String, plantId: String) async -> Bool {
        do {
            try await service.createLegacyEvent(userId: userId, plantId: plantId, reason: plant.legacyReason)
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't add that legacy event."
            return false
        }
    }

    func restoreFromLegacy(userId: String, plantId: String) async -> Bool {
        do {
            try await service.restorePlantFromLegacy(plantId: plantId, userId: userId)
            await load(plantId: plantId, userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't restore this plant."
            return false
        }
    }

    private static func potsWithUsage(
        pots: [PlantPot],
        activePlants: [(id: String, name: String, currentPotId: String?)]
    ) -> [PlantPot] {
        let usageMap: [String: (String, String)] = Dictionary(uniqueKeysWithValues: activePlants.compactMap { plant in
            guard let potId = plant.currentPotId else { return nil }
            return (potId, (plant.id, plant.name))
        })

        return pots.map { pot in
            let usage = usageMap[pot.id]
            return PlantPot(
                id: pot.id,
                name: pot.name,
                sizeInches: pot.sizeInches,
                material: pot.material,
                photoUrl: pot.photoUrl,
                isRetired: pot.isRetired,
                hasDrainage: pot.hasDrainage,
                color: pot.color,
                inUse: usage != nil,
                usedByPlantId: usage?.0,
                usedByPlantName: usage?.1
            )
        }
    }
}
