//
//  TimelineEventBadgeView.swift
//  Leafbook
//

import SwiftUI

struct TimelineEventDisplay {
    let label: String
    let symbol: String
    let color: Color

    static let defaultEvent = TimelineEventDisplay(
        label: "Event",
        symbol: "leaf.fill",
        color: LeafbookColors.primary
    )

    static func from(eventType: String) -> TimelineEventDisplay {
        switch eventType {
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

struct TimelineEventBadgeView: View {
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
