//
//  TimelineItemCardView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/1/26.
//

import SwiftUI

struct TimelineItemCard: View {
    let item: TimelineItem
    let thumbnailURL: URL?
    let linkedEventLabel: String?
    let dateFormatter: DateFormatter

    var body: some View {
        LeafbookCard(horizontalPadding: 8) {
            HStack(alignment: .center, spacing: 8) {
                DashboardThumbnailView(url: thumbnailURL, size: 96)

                VStack(alignment: .leading, spacing: 4) {
                    headerRow
                    
                    if let plantLine {
                        Text(plantLine)
                            .font(.system(.caption, design: .serif))
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                    }

                    if case .event = item {
                        TimelineEventBadgeView(display: eventDisplay)
                    }

                    if let subtitle {
                        Text(subtitle)
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.75))
                    }

                    if let secondarySubtitle {
                        Text(secondarySubtitle)
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                    }

                    if let linkedEventLabel {
                        Text(linkedEventLabel)
                            .font(.caption)
                            .foregroundStyle(LeafbookColors.primary)
                    }

                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var headerRow: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.headline)
            Spacer()
            Text(dateLabel)
                .font(.caption)
                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
        }
    }

    private var title: String {
        switch item {
        case .event(let event):
            return event.eventType.displayName
        case .journal(let entry):
            return entry.title ?? "Journal note"
        case .issue(let issue):
            return issue.issueType.displayName
        }
    }

    private var subtitle: String? {
        switch item {
        case .event(let event):
            if event.eventType == .moved, let metadata = event.metadata {
                if let fromLocation = metadata.fromLocation, let toLocation = metadata.toLocation {
                    return "\(fromLocation) → \(toLocation)"
                }
                if let toLocation = metadata.toLocation {
                    return "Moved to \(toLocation)"
                }
                if let fromLocation = metadata.fromLocation {
                    return "Moved from \(fromLocation)"
                }
            }
            return event.notes
        case .journal(let entry):
            return entry.content
        case .issue(let issue):
            return issue.description
        }
    }

    private var secondarySubtitle: String? {
        switch item {
        case .event(let event):
            if event.eventType == .moved {
                return event.notes
            }
            return nil
        default:
            return nil
        }
    }

    private var plantLine: String? {
        switch item {
        case .event(let event):
            return event.plant?.name
        case .journal(let entry):
            return entry.plant.name
        case .issue(let issue):
            return issue.plant?.name
        }
    }

    private var dateLabel: String {
        if let date = item.sortDate {
            return dateFormatter.string(from: date)
        }
        return item.rawDateString ?? "Unknown date"
    }

    private var eventDisplay: TimelineEventDisplay {
        guard case let .event(event) = item else {
            return .defaultEvent
        }
        return .from(eventType: event.eventType)
    }
}

#Preview {
    let formatter = DateFormatter()
    formatter.dateStyle = .medium
    formatter.timeStyle = .none

    return TimelineItemCard(
        item: .event(.preview),
        thumbnailURL: URL(string: PlantPhoto.preview.url),
        linkedEventLabel: "Linked to watered",
        dateFormatter: formatter
    )
    .padding()
    .background(LeafbookColors.background)
}
