//
//  LeafbookWidgetView.swift
//  LeafbookWidget
//
//  Created by AJ Glodowski on 2/10/26.
//

import SwiftUI
import WidgetKit

struct LeafbookWidgetView: View {
    let entry: PlantCareTimelineEntry

    var body: some View {
        if entry.isSignedOut {
            signedOutView
        } else if entry.plants.isEmpty {
            allCaughtUpView
        } else {
            plantListView
        }
    }

    private var signedOutView: some View {
        VStack(spacing: 8) {
            Image(systemName: "leaf.fill")
                .font(.title3)
                .foregroundStyle(WidgetColors.primary)
            Text("Sign in to Leafbook")
                .font(.system(.headline, design: .serif))
                .foregroundStyle(WidgetColors.foreground)
            Text("Open the app to get started")
                .font(.caption)
                .foregroundStyle(WidgetColors.foreground.opacity(0.6))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var allCaughtUpView: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(WidgetColors.primary)
                .font(.title3)
            VStack(alignment: .leading, spacing: 4) {
                Text("All caught up!")
                    .font(.headline)
                    .foregroundStyle(WidgetColors.foreground)
                Text("Your plants are well cared for")
                    .font(.subheadline)
                    .foregroundStyle(WidgetColors.foreground.opacity(0.7))
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var plantListView: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack(spacing: 6) {
                Image(systemName: "leaf.fill")
                    .foregroundStyle(WidgetColors.primary)
                    .font(.caption)
                Text("Needs Attention")
                    .font(.system(.subheadline, design: .serif).weight(.semibold))
                    .foregroundStyle(WidgetColors.foreground)
                Spacer()
                let overdueCount = entry.plants.filter { $0.wateringStatus == .overdue }.count
                if overdueCount > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "drop.fill")
                            .font(.system(size: 8))
                        Text("\(overdueCount) thirsty")
                            .font(.caption2.weight(.medium))
                    }
                    .foregroundStyle(WidgetColors.waterBlue)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(WidgetColors.waterBlue.opacity(0.15))
                    .clipShape(Capsule())
                }
            }

            Spacer(minLength: 4)

            // Plant rows with equal spacing
            ForEach(Array(entry.plants.prefix(3).enumerated()), id: \.element.plantId) { index, plant in
                if index > 0 {
                    Spacer(minLength: 2)
                    Divider()
                        .foregroundStyle(WidgetColors.muted.opacity(0.4))
                    Spacer(minLength: 2)
                }
                WidgetPlantRow(plant: plant)
            }

            Spacer(minLength: 0)
        }
    }
}

struct WidgetPlantRow: View {
    let plant: WidgetPlantEntry

    var body: some View {
        HStack(spacing: 8) {
            // Thumbnail
            if let imageData = plant.imageData, let uiImage = UIImage(data: imageData) {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 34, height: 34)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            } else {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(WidgetColors.muted.opacity(0.5))
                    Image(systemName: "leaf")
                        .foregroundStyle(WidgetColors.foreground.opacity(0.6))
                        .font(.caption2)
                }
                .frame(width: 34, height: 34)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(plant.plantName)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(WidgetColors.foreground)
                    .lineLimit(1)
                Text(statusText)
                    .font(.caption2)
                    .foregroundStyle(WidgetColors.foreground.opacity(0.6))
                    .lineLimit(1)
            }

            Spacer(minLength: 4)

            // Status pill
            HStack(spacing: 3) {
                Image(systemName: statusIcon)
                    .font(.system(size: 7))
                Text(statusLabel)
                    .font(.system(size: 10, weight: .medium))
            }
            .foregroundStyle(statusColor)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(statusColor.opacity(0.15))
            .clipShape(Capsule())
            .fixedSize()
        }
    }

    private var statusText: String {
        switch plant.wateringStatus {
        case .overdue:
            return "Last watered \(DashboardUtils.formatTimeAgo(plant.lastWateredAt))"
        case .dueSoon:
            return "Due soon"
        case .notStarted:
            return "Not tracked yet"
        case .ok, .notDue:
            let days = DashboardUtils.getDaysUntilDue(plant.waterDueAt)
            if days == 1 { return "Water tomorrow" }
            return "Water in \(days) days"
        }
    }

    private var statusLabel: String {
        switch plant.wateringStatus {
        case .overdue: return "Overdue"
        case .dueSoon: return "Soon"
        case .notStarted: return "New"
        case .ok, .notDue: return "Upcoming"
        }
    }

    private var statusIcon: String {
        switch plant.wateringStatus {
        case .overdue: return "exclamationmark.triangle.fill"
        case .dueSoon: return "clock.fill"
        case .notStarted: return "questionmark.circle.fill"
        case .ok, .notDue: return "drop.fill"
        }
    }

    private var statusColor: Color {
        switch plant.wateringStatus {
        case .overdue: return WidgetColors.issueOrange
        case .dueSoon: return .orange
        case .notStarted: return WidgetColors.muted
        case .ok, .notDue: return WidgetColors.waterBlue
        }
    }
}

// MARK: - Previews

#Preview("Plants", as: .systemMedium) {
    LeafbookWidget()
} timeline: {
    PlantCareTimelineEntry.placeholder
}

#Preview("All Caught Up", as: .systemMedium) {
    LeafbookWidget()
} timeline: {
    PlantCareTimelineEntry.allCaughtUp
}

#Preview("Signed Out", as: .systemMedium) {
    LeafbookWidget()
} timeline: {
    PlantCareTimelineEntry.signedOut
}
