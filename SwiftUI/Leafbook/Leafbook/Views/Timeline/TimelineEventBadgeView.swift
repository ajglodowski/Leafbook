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

    static func from(eventType: TimelineEventType) -> TimelineEventDisplay {
        return .init(
            label: eventType.displayName,
            symbol: eventType.symbolName,
            color: eventType.badgeColor
        )
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
