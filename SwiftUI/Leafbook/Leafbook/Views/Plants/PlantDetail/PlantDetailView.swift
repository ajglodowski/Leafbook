//
//  PlantDetailView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct PlantDetailView: View {
    let plantId: String

    @EnvironmentObject private var sessionState: SessionState
    @State private var viewModel = PlantDetailViewModel()
    @State private var journalViewModel = JournalViewModel()
    @State private var selectedTab: PlantDetailTab = .overview
    @State private var showingEditPlant = false
    @State private var showingCarePreferences = false
    @State private var showingIssueForm = false
    @State private var showingRepotForm = false
    @State private var showingMoveForm = false
    @State private var showingJournalEntry = false
    @State private var editingEvent: PlantEvent?
    @State private var editingEntry: JournalEntry?
    @State private var hasLoaded = false
    @State private var linkedPlantId: String?
    @State private var showingMarkAsLegacy = false
    @State private var showingRestoreConfirmation = false

    init(plantId: String) {
        self.plantId = plantId
    }

    var body: some View {
        Group {
            if viewModel.isLoading && !viewModel.hasLoadedData {
                PlantDetailSkeleton()
            } else {
                plantContent
            }
        }
        .background(LeafbookColors.background)
        .navigationTitle(viewModel.hasLoadedData ? viewModel.plant.displayName : "Loading...")
        .task {
            guard !hasLoaded else {
                return
            }
            if case let .signedIn(userId) = sessionState.status {
                hasLoaded = true
                await viewModel.load(plantId: plantId, userId: userId)
            }
        }
        .onChange(of: sessionState.status) { _, newStatus in
            if case let .signedIn(userId) = newStatus, !hasLoaded {
                hasLoaded = true
                Task {
                    await viewModel.load(plantId: plantId, userId: userId)
                }
            }
        }
        .sheet(isPresented: $showingEditPlant) {
            PlantEditFormView(plant: viewModel.plant, parentOptions: parentOptions()) { name, nickname, plantLocation, location, lightExposure, sizeCategory, howAcquired, description, acquiredAt, parentPlantId in
                guard case let .signedIn(userId) = await sessionState.status else { return false }
                return await viewModel.savePlantEdits(
                    plantId: plantId,
                    userId: userId,
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
            }
        }
        .sheet(isPresented: $showingCarePreferences) {
            PlantCarePreferencesFormView(
                initialWateringDays: viewModel.carePreferences?.wateringFrequencyDays,
                initialFertilizingDays: viewModel.carePreferences?.fertilizingFrequencyDays
            ) { wateringDays, fertilizingDays in
                guard case let .signedIn(userId) = await sessionState.status else { return false }
                return await viewModel.saveCarePreferences(
                    plantId: plantId,
                    userId: userId,
                    wateringDays: wateringDays,
                    fertilizingDays: fertilizingDays
                )
            }
        }
        .sheet(isPresented: $showingIssueForm) {
            PlantIssueFormView { issueType, severity, description in
                guard case let .signedIn(userId) = await sessionState.status else { return false }
                return await viewModel.addIssue(
                    userId: userId,
                    plantId: plantId,
                    issueType: issueType,
                    severity: severity,
                    description: description
                )
            }
        }
        .sheet(isPresented: $showingRepotForm) {
            PlantRepotFormView(currentPot: viewModel.currentPot, availablePots: viewModel.unusedPots) { potId in
                guard case let .signedIn(userId) = await sessionState.status else { return false }
                return await viewModel.repotPlant(userId: userId, plantId: plantId, potId: potId)
            }
        }
        .sheet(isPresented: $showingMoveForm) {
            PlantMoveFormView(currentLocation: viewModel.plant.location, title: "Move") { date, location, notes in
                guard case let .signedIn(userId) = await sessionState.status else { return false }
                return await viewModel.movePlant(
                    userId: userId,
                    plantId: plantId,
                    eventDate: date,
                    toLocation: location,
                    notes: notes
                )
            }
        }
        .sheet(item: $editingEvent) { event in
            eventEditView(for: event)
        }
        .sheet(isPresented: $showingJournalEntry) {
            JournalEntryFormView(initialPlantId: plantId) { plantId, title, content, date, eventId, _ in
                guard case let .signedIn(userId) = await sessionState.status else { return false }
                return await viewModel.createJournalEntry(
                    userId: userId,
                    plantId: plantId,
                    title: title,
                    content: content,
                    entryDate: date,
                    eventId: eventId
                )
            }
        }
        .sheet(item: $editingEntry) { entry in
            JournalEntryFormView(
                entryToEdit: entry,
                onSave: { plantId, title, content, date, eventId, entryId in
                    await handleJournalSave(
                        entryId: entryId,
                        plantId: plantId,
                        title: title,
                        content: content,
                        entryDate: date,
                        eventId: eventId
                    )
                },
                onDelete: { entryId in
                    await handleJournalDelete(entryId: entryId)
                }
            )
        }
        .navigationDestination(item: $linkedPlantId) { plantId in
            PlantDetailView(plantId: plantId)
        }
        .sheet(isPresented: $showingMarkAsLegacy) {
            MarkAsLegacySheet { reason in
                guard case let .signedIn(userId) = await sessionState.status else { return false }
                return await viewModel.markAsLegacy(userId: userId, plantId: plantId, reason: reason)
            }
        }
        .confirmationDialog("Restore this plant?", isPresented: $showingRestoreConfirmation, titleVisibility: .visible) {
            Button("Restore") {
                guard case let .signedIn(userId) = sessionState.status else { return }
                Task {
                    _ = await viewModel.restoreFromLegacy(userId: userId, plantId: plantId)
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will move the plant back to your active collection.")
        }
    }

    // MARK: - Plant Content

    private var plantContent: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 16) {
                PlantHeroView(
                    plant: viewModel.plant,
                    photo: viewModel.heroPhoto,
                    dueTask: viewModel.dueTask,
                    photoCount: viewModel.photos.count,
                    onWater: { date in logCareEvent(eventType: "watered", eventDate: date) },
                    onFertilize: { date in logCareEvent(eventType: "fertilized", eventDate: date) },
                    onMove: { showingMoveForm = true },
                    onEdit: { showingEditPlant = true }
                )
                
                VStack {
                    tabBar
                    tabContent
                }
                .padding()
            }
        }
    }

    private var tabBar: some View {
        IconLabelTabBar(tabs: PlantDetailTab.allCases, selection: $selectedTab)
    }

    private var photoUploadHandler: ((Data, Date, String?) async -> String?)? {
        guard !viewModel.isLegacy else { return nil }

        return { imageData, takenAt, caption in
            guard case let .signedIn(userId) = await self.sessionState.status else {
                return "We couldn't upload this photo."
            }
            return await self.viewModel.uploadPhoto(
                userId: userId,
                plantId: self.plantId,
                imageData: imageData,
                takenAt: takenAt,
                caption: caption
            )
        }
    }

    private var tabContent: some View {
        Group {
            switch selectedTab {
            case .overview:
                PlantDetailOverviewTab(
                    plant: viewModel.plant,
                    isLegacy: viewModel.isLegacy,
                    dueTask: viewModel.dueTask,
                    journalEntries: viewModel.journalEntries,
                    activeIssuesCount: viewModel.activeIssues.count,
                    onEditPlant: { showingEditPlant = true },
                    onAddIssue: { showingIssueForm = true },
                    onAddJournal: { showingJournalEntry = true },
                    onMarkAsLegacy: { showingMarkAsLegacy = true },
                    onRestore: { showingRestoreConfirmation = true }
                )
            case .care:
                PlantDetailCareTab(
                    plant: viewModel.plant,
                    isLegacy: viewModel.isLegacy,
                    dueTask: viewModel.dueTask,
                    carePreferences: viewModel.carePreferences,
                    scheduleSuggestion: viewModel.scheduleSuggestion,
                    currentPot: viewModel.currentPot,
                    unusedPots: viewModel.unusedPots,
                    hasCustomCare: viewModel.hasCustomCare,
                    onWater: { date in logCareEvent(eventType: "watered", eventDate: date) },
                    onFertilize: { date in logCareEvent(eventType: "fertilized", eventDate: date) },
                    onEditCarePreferences: { showingCarePreferences = true },
                    onRepot: { showingRepotForm = true },
                    onAcceptSuggestion: { acceptScheduleSuggestion() },
                    onDismissSuggestion: { dismissScheduleSuggestion() }
                )
            case .timeline:
                PlantDetailTimelineTab(
                    events: viewModel.events,
                    journalEntries: viewModel.journalEntries,
                    issues: viewModel.issues,
                    isLegacy: viewModel.isLegacy,
                    onSelectEvent: { event in
                        editingEvent = event
                    },
                    onSelectJournalEntry: { entry in
                        editingEntry = entry
                    },
                    onAddAcquiredEvent: {
                        guard case let .signedIn(userId) = await sessionState.status else { return false }
                        return await viewModel.createAcquiredEvent(userId: userId, plantId: plantId)
                    },
                    onAddLegacyEvent: {
                        guard case let .signedIn(userId) = await sessionState.status else { return false }
                        return await viewModel.createLegacyEvent(userId: userId, plantId: plantId)
                    }
                )
            case .photos:
                PlantDetailPhotosTab(
                    photos: viewModel.photos,
                    plantName: viewModel.plant.displayName,
                    activePhotoId: viewModel.plant.activePhotoId,
                    onUpdatePhoto: { photo, takenAt, caption in
                        guard case let .signedIn(userId) = await sessionState.status else {
                            return "We couldn't update this photo."
                        }
                        return await viewModel.updatePhotoMetadata(
                            userId: userId,
                            photoId: photo.id,
                            takenAt: takenAt,
                            caption: caption
                        )
                    },
                    onUploadPhoto: photoUploadHandler
                )
            case .propagation:
                PlantDetailPropagationTab(
                    plantName: viewModel.plant.displayName,
                    isLegacy: viewModel.isLegacy,
                    group: viewModel.propagationGroup,
                    photosByPlantId: viewModel.propagationPhotosByPlantId,
                    onSetParent: { parentId, propagationDate in
                        guard case let .signedIn(userId) = await sessionState.status else { return false }
                        return await viewModel.setParentPlant(
                            userId: userId,
                            plantId: plantId,
                            parentPlantId: parentId,
                            propagationDate: propagationDate
                        )
                    },
                    onClearParent: {
                        guard case let .signedIn(userId) = await sessionState.status else { return false }
                        return await viewModel.clearParentPlant(userId: userId, plantId: plantId)
                    },
                    onCreatePropagation: { draft in
                        guard case let .signedIn(userId) = await sessionState.status else { return nil }
                        return await viewModel.createPropagatedPlant(
                            userId: userId,
                            plantId: plantId,
                            parentPlantId: plantId,
                            plantTypeId: viewModel.plant.plantTypeId,
                            draft: draft
                        )
                    },
                    onSelectPlant: { plantId in
                        linkedPlantId = plantId
                    }
                )
            case .notes:
                PlantDetailNotesTab(description: viewModel.plant.description)
            case .typeInfo:
                PlantDetailTypeTab(plantType: viewModel.plant.plantTypes)
            }
        }
    }

    // MARK: - Actions

    private func logCareEvent(eventType: String, eventDate: Date = Date()) {
        guard case let .signedIn(userId) = sessionState.status else { return }
        Task {
            _ = await viewModel.logCareEvent(
                userId: userId,
                plantId: plantId,
                eventType: eventType,
                eventDate: eventDate
            )
        }
    }

    private func eventEditView(for event: PlantEvent) -> some View {
        let eventDate = parseDate(event.eventDate) ?? Date()

        switch event.eventType {
        case "moved":
            return AnyView(
                PlantMoveFormView(
                    currentLocation: event.metadata?.fromLocation ?? viewModel.plant.location,
                    initialDate: eventDate,
                    initialDestination: event.metadata?.toLocation ?? "",
                    initialNotes: event.notes ?? "",
                    title: "Edit move"
                ) { date, location, notes in
                    guard case let .signedIn(userId) = await sessionState.status else { return false }
                    return await viewModel.updateMoveEvent(
                        userId: userId,
                        plantId: plantId,
                        event: event,
                        eventDate: date,
                        toLocation: location,
                        notes: notes
                    )
                } onDelete: {
                    guard case let .signedIn(userId) = await sessionState.status else { return false }
                    return await viewModel.deleteEvent(userId: userId, plantId: plantId, event: event)
                }
            )
        case "repotted":
            let (currentPot, availablePots) = repotOptions(for: event)
            return AnyView(
                RepotEventFormView(
                    title: "Edit repot",
                    currentPot: currentPot,
                    availablePots: availablePots,
                    initialDate: eventDate,
                    initialPotId: event.metadata?.toPotId
                ) { date, potId in
                    guard case let .signedIn(userId) = await sessionState.status else { return false }
                    return await viewModel.updateRepotEvent(
                        userId: userId,
                        plantId: plantId,
                        eventId: event.id,
                        eventDate: date,
                        fromPotId: event.metadata?.fromPotId,
                        toPotId: potId
                    )
                } onDelete: {
                    guard case let .signedIn(userId) = await sessionState.status else { return false }
                    return await viewModel.deleteEvent(userId: userId, plantId: plantId, event: event)
                }
            )
        case "propagated":
            return AnyView(
                PropagationEventFormView(
                    title: "Edit propagation",
                    parentOptions: parentOptions(),
                    initialDate: eventDate,
                    initialNotes: event.notes ?? "",
                    initialParentId: event.metadata?.parentPlantId
                ) { date, notes, parentId in
                    guard case let .signedIn(userId) = await sessionState.status else { return false }
                    return await viewModel.updatePropagationEvent(
                        userId: userId,
                        plantId: plantId,
                        eventId: event.id,
                        eventDate: date,
                        notes: notes,
                        parentPlantId: parentId
                    )
                } onDelete: {
                    guard case let .signedIn(userId) = await sessionState.status else { return false }
                    return await viewModel.deleteEvent(userId: userId, plantId: plantId, event: event)
                }
            )
        default:
            return AnyView(
                CareEventFormView(
                    title: "Edit \(event.eventType.replacingOccurrences(of: "_", with: " "))",
                    initialDate: eventDate,
                    initialNotes: event.notes ?? ""
                ) { date, notes in
                    guard case let .signedIn(userId) = await sessionState.status else { return false }
                    return await viewModel.updateCareEvent(
                        userId: userId,
                        plantId: plantId,
                        eventId: event.id,
                        eventDate: date,
                        notes: notes
                    )
                } onDelete: {
                    guard case let .signedIn(userId) = await sessionState.status else { return false }
                    return await viewModel.deleteEvent(userId: userId, plantId: plantId, event: event)
                }
            )
        }
    }

    private func parentOptions() -> [ParentPlantOption] {
        viewModel.propagationGroup.availableParents.map { plant in
            ParentPlantOption(
                id: plant.id,
                title: plant.displayName,
                subtitle: plant.nickname?.isEmpty == false ? plant.name : nil
            )
        }
    }

    private func repotOptions(for event: PlantEvent) -> (current: PlantPot?, options: [PlantPot]) {
        let currentPot = event.metadata?.fromPotId.flatMap { id in
            viewModel.pots.first(where: { $0.id == id })
        }
        let available = viewModel.unusedPots
        if let currentPot, available.contains(currentPot) == false {
            return (currentPot, [currentPot] + available)
        }
        return (currentPot, available)
    }

    private func handleJournalSave(
        entryId: String?,
        plantId: String,
        title: String?,
        content: String,
        entryDate: Date,
        eventId: String?
    ) async -> Bool {
        let status = await sessionState.status
        guard case let .signedIn(userId) = status else { return false }

        let result: Bool
        if let entryId {
            result = await journalViewModel.updateEntry(
                entryId: entryId,
                userId: userId,
                plantId: plantId,
                title: title,
                content: content,
                entryDate: entryDate,
                eventId: eventId
            )
        } else {
            result = await journalViewModel.createEntry(
                userId: userId,
                plantId: plantId,
                title: title,
                content: content,
                entryDate: entryDate,
                eventId: eventId
            )
        }

        if result {
            await viewModel.load(plantId: self.plantId, userId: userId)
        }
        return result
    }

    private func handleJournalDelete(entryId: String) async -> Bool {
        let status = await sessionState.status
        guard case let .signedIn(userId) = status else { return false }

        let result = await journalViewModel.deleteEntry(entryId: entryId, userId: userId)
        if result {
            await viewModel.load(plantId: plantId, userId: userId)
        }
        return result
    }

    private func parseDate(_ dateString: String?) -> Date? {
        guard let dateString else { return nil }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: dateString) {
            return date
        }
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: dateString)
    }

    private func acceptScheduleSuggestion() {
        guard case let .signedIn(userId) = sessionState.status,
              let suggestionId = viewModel.scheduleSuggestion?.id else { return }
        Task {
            _ = await viewModel.acceptSuggestion(userId: userId, plantId: plantId, suggestionId: suggestionId)
        }
    }

    private func dismissScheduleSuggestion() {
        guard case let .signedIn(userId) = sessionState.status,
              let suggestionId = viewModel.scheduleSuggestion?.id else { return }
        Task {
            _ = await viewModel.dismissSuggestion(userId: userId, plantId: plantId, suggestionId: suggestionId)
        }
    }
}

#Preview {
    NavigationStack {
        PlantDetailView(plantId: "00000000-0000-0000-0000-000000000001")
    }
    .environmentObject(SessionState(isPreview: true))
}
