//
//  DashboardPlantTaskRow.swift
//  Leafbook
//

import SwiftUI

/// A reusable row used by both "Needs Attention" and "Coming Up This Week" sections.
struct DashboardPlantTaskRow: View {
    let plantId: String
    let plantName: String
    let thumbnailURL: URL?
    let statusText: String
    let logTitle: String
    let logIcon: String
    let logTint: Color
    let onLog: (Date) -> Void

    var body: some View {
        HStack(spacing: 12) {
            NavigationLink {
                PlantDetailView(plantId: plantId)
            } label: {
                DashboardThumbnailView(url: thumbnailURL, size: 64)
                    .cornerRadius(16)
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 4) {
                NavigationLink {
                    PlantDetailView(plantId: plantId)
                } label: {
                    Text(plantName)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(LeafbookColors.foreground)
                }
                .buttonStyle(.plain)

                Text(statusText)
                    .font(.caption)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
            }
            .padding(.vertical, 4)

            Spacer()

            CareLogButton(
                title: logTitle,
                systemImage: logIcon,
                tint: logTint,
                onLog: onLog
            )
            .controlSize(.small)
        }
        .padding(.trailing, 16)
    }
}

#Preview {
    NavigationStack {
        VStack(spacing: 8) {
            LeafbookCard(verticalPadding: 0, horizontalPadding: 0) {
                DashboardPlantTaskRow(
                    plantId: PlantDueTask.preview.plantId,
                    plantName: PlantDueTask.preview.plantName,
                    thumbnailURL: URL(string: PlantPhoto.preview.url),
                    statusText: "Last watered 3 days ago",
                    logTitle: "Water",
                    logIcon: "drop",
                    logTint: LeafbookColors.waterBlue,
                    onLog: { _ in }
                )
            }
            LeafbookCard(verticalPadding: 0, horizontalPadding: 0) {
                DashboardPlantTaskRow(
                    plantId: PlantDueTask.preview.plantId,
                    plantName: PlantDueTask.preview.plantName,
                    thumbnailURL: nil,
                    statusText: "Water in 3 days",
                    logTitle: "Water",
                    logIcon: "drop",
                    logTint: LeafbookColors.waterBlue,
                    onLog: { _ in }
                )
            }
            LeafbookCard(verticalPadding: 0, horizontalPadding: 0) {
                DashboardPlantTaskRow(
                    plantId: PlantDueTask.preview.plantId,
                    plantName: PlantDueTask.preview.plantName,
                    thumbnailURL: nil,
                    statusText: "Overdue",
                    logTitle: "Fertilize",
                    logIcon: "sparkles",
                    logTint: LeafbookColors.fertilizerAmber,
                    onLog: { _ in }
                )
            }
        }
        .padding()
        .background(LeafbookColors.background)
    }
}
