//
//  PlantDetailTimelineTab.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantDetailTimelineTab: View {
    let events: [PlantEvent]
    let journalEntries: [JournalEntry]
    let issues: [PlantIssue]
    var onSelectEvent: ((PlantEvent) -> Void)? = nil
    var onSelectJournalEntry: ((JournalEntry) -> Void)? = nil
    var onAddAcquiredEvent: (() async -> Bool)? = nil

    @State private var isAddingAcquiredEvent = false
    @State private var acquiredEventError: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            let eventLookup = Dictionary(uniqueKeysWithValues: events.map { ($0.id, $0) })
            let hasAcquiredEvent = events.contains { $0.eventType == "acquired" }

            if !hasAcquiredEvent {
                LeafbookCard {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Add an acquired event")
                            .font(.headline)
                        Text("Capture when this plant joined your collection.")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                        Button(isAddingAcquiredEvent ? "Adding…" : "Add acquired event") {
                            guard let onAddAcquiredEvent else { return }
                            acquiredEventError = nil
                            isAddingAcquiredEvent = true
                            Task {
                                let success = await onAddAcquiredEvent()
                                if !success {
                                    acquiredEventError = "We couldn't add that event."
                                }
                                isAddingAcquiredEvent = false
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(isAddingAcquiredEvent)
                        if let acquiredEventError {
                            Text(acquiredEventError)
                                .font(.footnote)
                                .foregroundStyle(.red)
                        }
                    }
                }
            }

            LeafbookCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Care events")
                        .font(.headline)
                    if events.isEmpty {
                        Text("No care events yet.")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    } else {
                        ForEach(events) { event in
                            let moveDetail = moveSubtitle(for: event)
                            Button {
                                onSelectEvent?(event)
                            } label: {
                                timelineRow(
                                    title: event.eventType.replacingOccurrences(of: "_", with: " ").capitalized,
                                    subtitle: moveDetail.primary ?? event.notes,
                                    secondarySubtitle: moveDetail.primary != nil ? event.notes : nil,
                                    dateString: event.eventDate
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }

            LeafbookCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Journal entries")
                        .font(.headline)
                    if journalEntries.isEmpty {
                        Text("No journal entries yet.")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    } else {
                        ForEach(journalEntries) { entry in
                            let linkedEvent = entry.eventId.flatMap { eventLookup[$0] }
                            let linkedLabel = linkedEvent.map { event in
                                event.eventType.replacingOccurrences(of: "_", with: " ").capitalized
                            }
                            Button {
                                onSelectJournalEntry?(entry)
                            } label: {
                                timelineRow(
                                    title: entry.title ?? "Journal note",
                                    subtitle: entry.content,
                                    dateString: entry.entryDate,
                                    footer: linkedLabel.map { "Linked to \($0)" }
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }

            LeafbookCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Issues")
                        .font(.headline)
                    if issues.isEmpty {
                        Text("No issues logged.")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    } else {
                        ForEach(issues) { issue in
                            timelineRow(
                                title: issue.issueType.capitalized,
                                subtitle: issue.description,
                                dateString: issue.startedAt ?? issue.resolvedAt
                            )
                        }
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func timelineRow(
        title: String,
        subtitle: String?,
        secondarySubtitle: String? = nil,
        dateString: String?,
        footer: String? = nil
    ) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .firstTextBaseline) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                Spacer()
                if let dateString, let dateLabel = formattedDate(dateString) {
                    Text(dateLabel)
                        .font(.caption)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                }
            }
            if let subtitle, !subtitle.isEmpty {
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
            }
            if let secondarySubtitle, !secondarySubtitle.isEmpty {
                Text(secondarySubtitle)
                    .font(.subheadline)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
            }
            if let footer {
                Text(footer)
                    .font(.caption)
                    .foregroundStyle(LeafbookColors.primary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 4)
    }

    private func formattedDate(_ dateString: String) -> String? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        let date = formatter.date(from: dateString) ?? ISO8601DateFormatter().date(from: dateString)
        guard let resolvedDate = date else { return nil }
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: resolvedDate)
    }

    private func moveSubtitle(for event: PlantEvent) -> (primary: String?, secondary: String?) {
        guard event.eventType == "moved", let metadata = event.metadata else {
            return (nil, nil)
        }
        if let fromLocation = metadata.fromLocation, let toLocation = metadata.toLocation {
            return ("\(fromLocation) → \(toLocation)", nil)
        }
        if let toLocation = metadata.toLocation {
            return ("Moved to \(toLocation)", nil)
        }
        if let fromLocation = metadata.fromLocation {
            return ("Moved from \(fromLocation)", nil)
        }
        return (nil, nil)
    }
}

#Preview {
    PlantDetailTimelineTab(
        events: [.preview],
        journalEntries: [.preview],
        issues: [.preview]
    )
    .padding()
    .background(LeafbookColors.background)
}
