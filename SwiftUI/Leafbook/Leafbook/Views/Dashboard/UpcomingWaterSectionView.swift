//
//  UpcomingWaterSectionView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/29/26.
//

import SwiftUI

struct UpcomingWaterSectionView: View {
    let tasks: [PlantDueTask]
    let photosByPlantId: [String: [PlantPhoto]]
    let onWater: (String, Date) -> Void

    private var upcomingTasks: [DashboardUpcomingTask] {
        tasks.compactMap { task in
            guard task.wateringStatus == .ok || task.wateringStatus == .notDue,
                  let dueDate = task.waterDueAt else { return nil }
            let daysUntil = DashboardUtils.getDaysUntilDue(dueDate)
            guard daysUntil > 0 && daysUntil <= 7 else { return nil }
            return DashboardUpcomingTask(task: task, daysUntilWater: daysUntil)
        }
        .sorted { $0.daysUntilWater < $1.daysUntilWater }
    }

    var body: some View {
        if upcomingTasks.isEmpty {
            EmptyView()
        } else {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Label("Coming Up This Week", systemImage: "clock")
                        .font(.system(.title3, design: .serif).weight(.semibold))
                    Spacer()
                    DashboardCapsuleBadge(
                        label: "\(upcomingTasks.count) upcoming",
                        systemImage: "drop.fill",
                        tint: LeafbookColors.waterBlue
                    )
                }

                VStack(alignment: .leading, spacing: 8) {
                    Label("Water soon", systemImage: "drop.fill")
                        .font(.subheadline)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    LazyVStack(spacing: 8) {
                        ForEach(upcomingTasks.prefix(6)) { upcoming in
                            LeafbookCard(verticalPadding: 0, horizontalPadding: 0) {
                                UpcomingTaskRow(
                                    task: upcoming.task,
                                    daysUntilWater: upcoming.daysUntilWater,
                                    thumbnailURL: DashboardUtils.getThumbnailUrl(
                                        plantId: upcoming.task.plantId,
                                        photosByPlant: photosByPlantId
                                    ),
                                    onWater: onWater
                                )
                            }
                        }
                    }
                    if upcomingTasks.count > 6 {
                        Text("+\(upcomingTasks.count - 6) more plants need water this week")
                            .font(.caption)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                    }
                }
            }
        }
    }
}

private struct UpcomingTaskRow: View {
    let task: PlantDueTask
    let daysUntilWater: Int
    let thumbnailURL: URL?
    let onWater: (String, Date) -> Void

    var body: some View {
        HStack(spacing: 12) {
            NavigationLink {
                PlantDetailView(plantId: task.plantId)
            } label: {
                DashboardThumbnailView(url: thumbnailURL, size: 64)
                    .cornerRadius(16)
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 4) {
                NavigationLink {
                    PlantDetailView(plantId: task.plantId)
                } label: {
                    Text(task.plantName)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(LeafbookColors.foreground)
                }
                .buttonStyle(.plain)

                Text(daysUntilWater == 1 ? "Water tomorrow" : "Water in \(daysUntilWater) days")
                    .font(.caption)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
            }
            .padding(.vertical, 8)

            Spacer()

            CareLogButton(
                title: "Water",
                systemImage: "drop",
                tint: LeafbookColors.waterBlue,
                onLog: { date in onWater(task.plantId, date) }
            )
            .controlSize(.small)
        }
        .padding(.trailing, 16)
    }
}

#Preview {
    NavigationStack {
        UpcomingWaterSectionView(
            tasks: [.preview],
            photosByPlantId: ["00000000-0000-0000-0000-000000000001": [.preview]],
            onWater: { _, _ in }
        )
        .padding()
        .background(LeafbookColors.background)
    }
}
