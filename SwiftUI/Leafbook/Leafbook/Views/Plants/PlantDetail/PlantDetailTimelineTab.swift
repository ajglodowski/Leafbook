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
    var isLegacy: Bool = false
    var onSelectEvent: ((PlantEvent) -> Void)? = nil
    var onSelectJournalEntry: ((JournalEntry) -> Void)? = nil
    var onAddAcquiredEvent: (() async -> Bool)? = nil
    var onAddLegacyEvent: (() async -> Bool)? = nil

    @State private var isAddingAcquiredEvent = false
    @State private var acquiredEventError: String?
    @State private var isAddingLegacyEvent = false
    @State private var legacyEventError: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            let eventLookup = Dictionary(uniqueKeysWithValues: events.map { ($0.id, $0) })
            let hasAcquiredEvent = events.contains { $0.eventType == "acquired" }
            let hasPropagationEvent = events.contains { $0.eventType == "propagated" }
            let shouldShowAcquiredPrompt = !hasAcquiredEvent && !hasPropagationEvent
            let hasLegacyEvent = events.contains { $0.eventType == "legacy" }
            let shouldShowLegacyPrompt = isLegacy && !hasLegacyEvent

            if shouldShowAcquiredPrompt {
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

            if shouldShowLegacyPrompt {
                LeafbookCard {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Add a legacy event")
                            .font(.headline)
                        Text("Record when this plant left your collection.")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                        Button(isAddingLegacyEvent ? "Adding…" : "Add legacy event") {
                            guard let onAddLegacyEvent else { return }
                            legacyEventError = nil
                            isAddingLegacyEvent = true
                            Task {
                                let success = await onAddLegacyEvent()
                                if !success {
                                    legacyEventError = "We couldn't add that event."
                                }
                                isAddingLegacyEvent = false
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(isAddingLegacyEvent)
                        if let legacyEventError {
                            Text(legacyEventError)
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
                                    dateString: event.eventDate,
                                    eventType: event.eventType
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
        footer: String? = nil,
        eventType: String? = nil
    ) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .firstTextBaseline) {
                Text(title)
                    .font(.headline)
                Spacer()
                if let dateString, let dateLabel = formattedDate(dateString) {
                    Text(dateLabel)
                        .font(.caption)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                }
            }
            if let eventType {
                TimelineEventBadgeView(display: .from(eventType: eventType))
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
        guard let date = Self.parseDate(from: dateString) else { return nil }
        return Self.displayDateFormatter.string(from: date)
    }

    private static func parseDate(from dateString: String) -> Date? {
        let trimmed = dateString.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        for formatter in isoFormatters {
            if let date = formatter.date(from: trimmed) {
                return date
            }
        }

        if trimmed.contains("T"), !hasTimezoneSuffix(in: trimmed) {
            let withZ = trimmed + "Z"
            for formatter in isoFormatters {
                if let date = formatter.date(from: withZ) {
                    return date
                }
            }
        }

        for formatter in fallbackDateFormatters {
            if let date = formatter.date(from: trimmed) {
                return date
            }
        }

        return nil
    }

    private static let displayDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter
    }()

    private static let isoFormatters: [ISO8601DateFormatter] = {
        let fractional = ISO8601DateFormatter()
        fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds, .withColonSeparatorInTimeZone]
        let plain = ISO8601DateFormatter()
        plain.formatOptions = [.withInternetDateTime, .withColonSeparatorInTimeZone]
        return [fractional, plain]
    }()

    private static func hasTimezoneSuffix(in string: String) -> Bool {
        guard let regex = timezoneSuffixRegex else { return false }
        let range = NSRange(string.startIndex..., in: string)
        return regex.firstMatch(in: string, options: [], range: range) != nil
    }

    private static let timezoneSuffixRegex: NSRegularExpression? = {
        try? NSRegularExpression(pattern: "(Z|[+-]\\d{2}:?\\d{2})$", options: .caseInsensitive)
    }()

    private static let fallbackDateFormatters: [DateFormatter] = [
        makeDateFormatter("yyyy-MM-dd'T'HH:mm:ss.SSSSSSXXXXX"),
        makeDateFormatter("yyyy-MM-dd'T'HH:mm:ss.SSSXXXXX"),
        makeDateFormatter("yyyy-MM-dd'T'HH:mm:ssXXXXX"),
        makeDateFormatter("yyyy-MM-dd'T'HH:mm:ss"),
        makeDateFormatter("yyyy-MM-dd HH:mm:ss"),
        makeDateFormatter("yyyy-MM-dd")
    ]

    private static func makeDateFormatter(_ format: String) -> DateFormatter {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .iso8601)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = format
        return formatter
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
