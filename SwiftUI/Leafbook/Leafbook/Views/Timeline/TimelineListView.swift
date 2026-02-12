//
//  TimelineListView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/31/26.
//

import SwiftUI

struct TimelineListView: View {
    @EnvironmentObject private var sessionState: SessionState
    @EnvironmentObject private var tabRouter: TabRouter
    @State private var viewModel: TimelineViewModel
    @State private var journalViewModel = JournalViewModel()

    @State private var selectedFeed: TimelineFeed
    @State private var selectedPlantId: String? = nil
    @State private var selectedEventType: TimelineEventType? = nil
    @State private var showingNewEntry = false
    @State private var editingEntry: JournalEntry? = nil
    @State private var editingEvent: PlantEvent? = nil

    init(
        viewModel: TimelineViewModel = TimelineViewModel(),
        initialFeed: TimelineFeed = .all
    ) {
        _viewModel = State(initialValue: viewModel)
        _selectedFeed = State(initialValue: initialFeed)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                filterHeader

                if timelineItems.isEmpty && !viewModel.isLoading {
                    EmptyStateView(
                        title: "No timeline activity",
                        message: "Log care, track issues, or write a journal note to start the story.",
                        systemImage: "clock"
                    )
                    .padding(.top, 20)
                } else {
                    LazyVStack(spacing: 12) {
                        ForEach(timelineItems) { item in
                            if case let .journal(entry) = item {
                                Button {
                                    editingEntry = entry
                                } label: {
                                    TimelineItemCard(
                                        item: item,
                                        thumbnailURL: viewModel.thumbnailURL(for: item),
                                        linkedEventLabel: linkedEventLabel(for: item),
                                        dateFormatter: dateFormatter
                                    )
                                }
                                .buttonStyle(.plain)
                            } else if case let .event(event) = item {
                                Button {
                                    editingEvent = event
                                } label: {
                                    TimelineItemCard(
                                        item: item,
                                        thumbnailURL: viewModel.thumbnailURL(for: item),
                                        linkedEventLabel: linkedEventLabel(for: item),
                                        dateFormatter: dateFormatter
                                    )
                                }
                                .buttonStyle(.plain)
                            } else {
                                TimelineItemCard(
                                    item: item,
                                    thumbnailURL: viewModel.thumbnailURL(for: item),
                                    linkedEventLabel: linkedEventLabel(for: item),
                                    dateFormatter: dateFormatter
                                )
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .background(LeafbookColors.background)
        .navigationTitle("Timeline")
        .toolbar {
            Button {
                showingNewEntry = true
            } label: {
                Image(systemName: "square.and.pencil")
            }
        }
        .sheet(isPresented: $showingNewEntry) {
            JournalEntryFormView { plantId, title, content, date, eventId, entryId in
                await handleJournalSave(
                    entryId: entryId,
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
        .sheet(item: $editingEvent) { event in
            eventEditView(for: event)
        }
        .onAppear {
            if let feed = tabRouter.requestedTimelineFeed {
                selectedFeed = feed
                tabRouter.requestedTimelineFeed = nil
            }
        }
        .onChange(of: tabRouter.requestedTimelineFeed) { feed in
            guard let feed else { return }
            selectedFeed = feed
            tabRouter.requestedTimelineFeed = nil
        }
        .task {
            guard !viewModel.isPreview else { return }
            if case let .signedIn(userId) = sessionState.status {
                await viewModel.load(userId: userId)
            }
        }
        .refreshable {
            guard !viewModel.isPreview else { return }
            if case let .signedIn(userId) = sessionState.status {
                await viewModel.load(userId: userId)
            }
        }
    }

    private var filterHeader: some View {
        VStack(alignment: .leading, spacing: 12) {
            IconLabelTabBar(
                tabs: TimelineFeed.allCases,
                selection: $selectedFeed,
                badgeCount: { tab in
                    switch tab {
                    case .issues:
                        return activeIssuesCount
                    default:
                        return 0
                    }
                }
            )

            HStack(spacing: 12) {
                Menu {
                    Button("All plants") { selectedPlantId = nil }
                    ForEach(viewModel.plants) { plant in
                        Button(plant.displayName) { selectedPlantId = plant.id }
                    }
                } label: {
                    filterChip(
                        title: selectedPlantId.flatMap { id in
                            viewModel.plants.first(where: { $0.id == id })?.displayName
                        } ?? "All plants",
                        systemImage: "leaf"
                    )
                }

                if selectedFeed == .events || selectedFeed == .all {
                    Menu {
                        Button("All events") { selectedEventType = nil }
                        ForEach(TimelineEventType.allCases) { event in
                            Button(event.label) { selectedEventType = event }
                        }
                    } label: {
                        filterChip(
                            title: selectedEventType?.label ?? "All events",
                            systemImage: "clock"
                        )
                    }
                }

                Spacer()
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func filterChip(title: String, systemImage: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: systemImage)
            Text(title)
        }
        .font(.caption.weight(.semibold))
        .padding(.vertical, 6)
        .padding(.horizontal, 10)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(LeafbookColors.card)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(LeafbookColors.foreground.opacity(0.08), lineWidth: 1)
        )
    }

    private var timelineItems: [TimelineItem] {
        let plantFilter = selectedPlantId

        let filteredEvents = viewModel.events.filter { event in
            if let plantFilter, event.plantId != plantFilter { return false }
            if let selectedEventType, event.eventType != selectedEventType.rawValue { return false }
            return true
        }

        let filteredIssues = viewModel.issues.filter { issue in
            if let plantFilter, issue.plantId != plantFilter { return false }
            return true
        }

        let filteredEntries = viewModel.entries.filter { entry in
            if let plantFilter, entry.plantId != plantFilter { return false }
            return true
        }

        var items: [TimelineItem] = []
        if selectedFeed == .all || selectedFeed == .events {
            items.append(contentsOf: filteredEvents.map { .event($0) })
        }
        if selectedFeed == .all || selectedFeed == .journal {
            items.append(contentsOf: filteredEntries.map { .journal($0) })
        }
        if selectedFeed == .all || selectedFeed == .issues {
            items.append(contentsOf: filteredIssues.map { .issue($0) })
        }

        return items.sorted { lhs, rhs in
            (lhs.sortDate ?? .distantPast) > (rhs.sortDate ?? .distantPast)
        }
    }

    private var activeIssuesCount: Int {
        viewModel.issues.filter { $0.status == "active" }.count
    }

    private func linkedEventLabel(for item: TimelineItem) -> String? {
        guard case let .journal(entry) = item, let eventId = entry.eventId else { return nil }
        guard let event = viewModel.events.first(where: { $0.id == eventId }) else { return "Linked event" }
        return "Linked to \(event.eventType.replacingOccurrences(of: "_", with: " ").capitalized)"
    }

    private func eventEditView(for event: PlantEvent) -> some View {
        let eventDate = parseDate(event.eventDate) ?? Date()
        let plantId = event.plantId

        switch event.eventType {
        case "moved":
            return AnyView(
                PlantMoveFormView(
                    currentLocation: event.metadata?.fromLocation,
                    initialDate: eventDate,
                    initialDestination: event.metadata?.toLocation ?? "",
                    initialNotes: event.notes ?? "",
                    title: "Edit move"
                ) { date, location, notes in
                    guard let plantId, case let .signedIn(userId) = await sessionState.status else { return false }
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
                    return await viewModel.deleteEvent(userId: userId, event: event)
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
                    guard let plantId, case let .signedIn(userId) = await sessionState.status else { return false }
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
                    return await viewModel.deleteEvent(userId: userId, event: event)
                }
            )
        case "propagated":
            return AnyView(
                PropagationEventFormView(
                    title: "Edit propagation",
                    parentOptions: parentOptions(excluding: plantId),
                    initialDate: eventDate,
                    initialNotes: event.notes ?? "",
                    initialParentId: event.metadata?.parentPlantId
                ) { date, notes, parentId in
                    guard case let .signedIn(userId) = await sessionState.status else { return false }
                    return await viewModel.updatePropagationEvent(
                        userId: userId,
                        eventId: event.id,
                        eventDate: date,
                        notes: notes,
                        parentPlantId: parentId
                    )
                } onDelete: {
                    guard case let .signedIn(userId) = await sessionState.status else { return false }
                    return await viewModel.deleteEvent(userId: userId, event: event)
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
                        eventId: event.id,
                        eventDate: date,
                        notes: notes
                    )
                } onDelete: {
                    guard case let .signedIn(userId) = await sessionState.status else { return false }
                    return await viewModel.deleteEvent(userId: userId, event: event)
                }
            )
        }
    }

    private func parentOptions(excluding plantId: String?) -> [ParentPlantOption] {
        viewModel.plants
            .filter { $0.id != plantId }
            .map { plant in
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
        let available = viewModel.pots.filter { ($0.isRetired ?? false) == false && ($0.inUse ?? false) == false }
        if let currentPot, available.contains(currentPot) == false {
            return (currentPot, [currentPot] + available)
        }
        return (currentPot, available)
    }

    private func parseDate(_ dateString: String?) -> Date? {
        guard let dateString else { return nil }
        if let date = ISO8601DateFormatter().date(from: dateString) {
            return date
        }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        return formatter.date(from: dateString)
    }

    private var dateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter
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
            await viewModel.load(userId: userId)
        }
        return result
    }

    private func handleJournalDelete(entryId: String) async -> Bool {
        let status = await sessionState.status
        guard case let .signedIn(userId) = status else { return false }

        let result = await journalViewModel.deleteEntry(entryId: entryId, userId: userId)
        if result {
            await viewModel.load(userId: userId)
        }
        return result
    }
}

extension TimelineFeed: @MainActor IconLabelTabItem {}

#Preview {
    NavigationStack {
        TimelineListView(viewModel: .preview())
    }
    .environmentObject(SessionState(isPreview: true))
    .environmentObject(TabRouter())
}
