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
    @State private var resolvingIssue: PlantIssue? = nil
    @State private var viewMode: TimelineViewMode = .list
    @State private var displayedMonth: Date = Date()
    @State private var selectedCalendarDay: IdentifiableDate? = nil

    init(
        viewModel: TimelineViewModel = TimelineViewModel(),
        initialFeed: TimelineFeed = .all
    ) {
        _viewModel = State(initialValue: viewModel)
        _selectedFeed = State(initialValue: initialFeed)
    }

    private var headerSubtitle: String {
        let totalEvents = viewModel.events.count
        let totalEntries = viewModel.entries.count
        let totalIssues = viewModel.issues.count
        let total = totalEvents + totalEntries + totalIssues
        guard total > 0 else { return "Your plant care history" }
        var parts: [String] = []
        if totalEvents > 0 {
            parts.append("\(totalEvents) event\(totalEvents == 1 ? "" : "s")")
        }
        if totalEntries > 0 {
            parts.append("\(totalEntries) note\(totalEntries == 1 ? "" : "s")")
        }
        if totalIssues > 0 {
            parts.append("\(totalIssues) issue\(totalIssues == 1 ? "" : "s")")
        }
        return parts.joined(separator: " · ")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Timeline")
                        .font(.system(.title, design: .serif).weight(.semibold))
                        .foregroundStyle(LeafbookColors.foreground)
                    Text(headerSubtitle)
                        .font(.subheadline)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                }
                Spacer()
                Button {
                    withAnimation {
                        viewMode = viewMode == .list ? .calendar : .list
                    }
                } label: {
                    Image(systemName: viewMode == .list ? "calendar" : "list.bullet")
                        .font(.title3)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                }
                Button {
                    showingNewEntry = true
                } label: {
                    Image(systemName: "square.and.pencil")
                        .font(.title3)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)

            filterHeader
                .padding(.horizontal, 16)

            ScrollView {
                VStack(spacing: 16) {
                    if viewMode == .calendar {
                        CalendarGridView(
                            displayedMonth: $displayedMonth,
                            dotColors: calendarDotColors,
                            selectedDay: selectedCalendarDay?.date,
                            onSelectDay: { day in
                                selectedCalendarDay = IdentifiableDate(day)
                            }
                        )
                    } else if timelineItems.isEmpty && !viewModel.isLoading {
                        EmptyStateView(
                            title: "No timeline activity",
                            message: "Log care, track issues, or write a journal note to start the story.",
                            systemImage: "clock"
                        )
                        .padding(.top, 20)
                    } else {
                        LazyVStack(spacing: 12) {
                            ForEach(timelineItems) { item in
                                if let plantId = item.plantId {
                                    NavigationLink(destination: PlantDetailView(plantId: plantId)) {
                                        TimelineItemCard(
                                            item: item,
                                            thumbnailURL: viewModel.thumbnailURL(for: item),
                                            linkedEventLabel: linkedEventLabel(for: item),
                                            dateFormatter: dateFormatter,
                                            onEdit: editAction(for: item)
                                        )
                                    }
                                    .buttonStyle(.plain)
                                } else {
                                    TimelineItemCard(
                                        item: item,
                                        thumbnailURL: viewModel.thumbnailURL(for: item),
                                        linkedEventLabel: linkedEventLabel(for: item),
                                        dateFormatter: dateFormatter,
                                        onEdit: editAction(for: item)
                                    )
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
            }
        }
        .background(LeafbookColors.background)
        .navigationBarHidden(true)
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
        .sheet(item: $resolvingIssue) { issue in
            IssueResolveFormView(issue: issue) { resolutionNotes in
                guard case let .signedIn(userId) = await sessionState.status else { return false }
                return await viewModel.resolveIssue(
                    userId: userId,
                    issueId: issue.id,
                    resolutionNotes: resolutionNotes
                )
            }
        }
        .sheet(item: $selectedCalendarDay) { identifiableDate in
            CalendarDaySheetView(
                date: identifiableDate.date,
                items: itemsForDay(identifiableDate.date),
                thumbnailURL: { viewModel.thumbnailURL(for: $0) },
                linkedEventLabel: { linkedEventLabel(for: $0) },
                onEdit: { editAction(for: $0) }
            )
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
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
            .fixedSize(horizontal: false, vertical: true)

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
                        ForEach(TimelineEventType.allCases, id: \.self) { event in
                            Button(event.displayName) { selectedEventType = event }
                        }
                    } label: {
                        filterChip(
                            title: selectedEventType?.displayName ?? "All events",
                            systemImage: "clock"
                        )
                    }
                }

                Spacer()
            }
        }
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
            if let selectedEventType, event.eventType != selectedEventType { return false }
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
        viewModel.issues.filter { $0.status == .active }.count
    }

    private var calendarDotColors: [Date: [Color]] {
        let cal = Calendar.current
        var grouped: [Date: [String: Color]] = [:]
        for item in timelineItems {
            guard let date = item.sortDate else { continue }
            let day = cal.startOfDay(for: date)
            let key: String
            switch item {
            case .event(let event): key = "event-\(event.eventType.rawValue)"
            case .journal: key = "journal"
            case .issue: key = "issue"
            }
            grouped[day, default: [:]][key] = item.dotColor
        }
        return grouped.mapValues { dict in
            Array(dict.values.prefix(4))
        }
    }

    private func itemsForDay(_ date: Date) -> [TimelineItem] {
        let cal = Calendar.current
        return timelineItems.filter { item in
            guard let itemDate = item.sortDate else { return false }
            return cal.isDate(itemDate, inSameDayAs: date)
        }
    }

    private func linkedEventLabel(for item: TimelineItem) -> String? {
        guard case let .journal(entry) = item, let eventId = entry.eventId else { return nil }
        guard let event = viewModel.events.first(where: { $0.id == eventId }) else { return "Linked event" }
        return "Linked to \(event.eventType.displayName)"
    }

    private func editAction(for item: TimelineItem) -> (() -> Void)? {
        switch item {
        case .journal(let entry):
            return { editingEntry = entry }
        case .event(let event):
            return { editingEvent = event }
        case .issue(let issue):
            if issue.status == .active {
                return { resolvingIssue = issue }
            }
            return nil
        }
    }

    private func eventEditView(for event: PlantEvent) -> some View {
        let eventDate = parseDate(event.eventDate) ?? Date()
        let plantId = event.plantId

        switch event.eventType {
        case .moved:
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
        case .repotted:
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
        case .propagated:
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
                    title: "Edit \(event.eventType.displayName)",
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
