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

                    if let plantLine {
                        Text(plantLine)
                            .font(.caption)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
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
            return event.eventType.replacingOccurrences(of: "_", with: " ").capitalized
        case .journal(let entry):
            return entry.title ?? "Journal note"
        case .issue(let issue):
            return issue.issueType.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }

    private var subtitle: String? {
        switch item {
        case .event(let event):
            if event.eventType == "moved", let metadata = event.metadata {
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
            if event.eventType == "moved" {
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

        switch event.eventType {
        case "watered":
            return .init(label: "Watered", symbol: "drop.fill", color: LeafbookColors.waterBlue)
        case "fertilized":
            return .init(label: "Fertilized", symbol: "sparkles", color: LeafbookColors.fertilizerAmber)
        case "repotted":
            return .init(label: "Repotted", symbol: "shippingbox.fill", color: LeafbookColors.primary)
        case "moved":
            return .init(label: "Moved", symbol: "arrow.up.right.square", color: LeafbookColors.purpleAccent)
        case "pruned":
            return .init(label: "Pruned", symbol: "scissors", color: LeafbookColors.roseAccent)
        case "rotated":
            return .init(label: "Rotated", symbol: "arrow.triangle.2.circlepath", color: LeafbookColors.purpleAccent)
        case "misted":
            return .init(label: "Misted", symbol: "cloud.drizzle.fill", color: LeafbookColors.waterBlue)
        case "cleaned":
            return .init(label: "Cleaned", symbol: "wind", color: LeafbookColors.primary)
        case "propagated":
            return .init(label: "Propagated", symbol: "leaf.arrow.circlepath", color: LeafbookColors.primary)
        case "acquired":
            return .init(label: "Acquired", symbol: "gift.fill", color: LeafbookColors.roseAccent)
        case "legacy":
            return .init(label: "Legacy", symbol: "archivebox.fill", color: LeafbookColors.foreground)
        case "restored":
            return .init(label: "Restored", symbol: "arrow.uturn.backward.circle.fill", color: LeafbookColors.primary)
        default:
            return .defaultEvent
        }
    }
}

private struct TimelineEventDisplay {
    let label: String
    let symbol: String
    let color: Color

    static let defaultEvent = TimelineEventDisplay(
        label: "Event",
        symbol: "leaf.fill",
        color: LeafbookColors.primary
    )
}

private struct TimelineEventBadgeView: View {
    let display: TimelineEventDisplay

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: display.symbol)
                .font(.caption2)
            Text(display.label)
                .font(.caption.weight(.semibold))
        }
        .padding(.vertical, 4)
        .padding(.horizontal, 8)
        .foregroundStyle(display.color)
        .background(display.color.opacity(0.14))
        .clipShape(Capsule())
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
