//
//  UpcomingWaterSectionView.swift
//  Leafbook
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
                                DashboardPlantTaskRow(
                                    plantId: upcoming.task.plantId,
                                    plantName: upcoming.task.plantName,
                                    thumbnailURL: DashboardUtils.getThumbnailUrl(
                                        plantId: upcoming.task.plantId,
                                        photosByPlant: photosByPlantId
                                    ),
                                    statusText: upcoming.daysUntilWater == 1
                                        ? "Water tomorrow"
                                        : "Water in \(upcoming.daysUntilWater) days",
                                    logTitle: "Water",
                                    logIcon: "drop",
                                    logTint: LeafbookColors.waterBlue,
                                    onLog: { onWater(upcoming.task.plantId, $0) }
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
