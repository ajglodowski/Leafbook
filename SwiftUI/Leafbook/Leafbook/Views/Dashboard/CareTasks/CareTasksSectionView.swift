//
//  CareTasksSectionView.swift
//  Leafbook
//

import SwiftUI

struct CareTasksSectionView: View {
    let tasks: [PlantDueTask]
    let hasPlants: Bool
    let photosByPlantId: [String: [PlantPhoto]]
    let onWater: (String, Date) -> Void
    let onFertilize: (String, Date) -> Void

    var body: some View {
        let needsWater = tasks.filter { task in
            guard let status = task.wateringStatus else { return false }
            return status == .overdue || status == .dueSoon || status == .notStarted
        }
        let needsFertilizer = tasks.filter { task in
            guard let status = task.fertilizingStatus else { return false }
            return status == .overdue || status == .dueSoon
        }
        let totalCareTasks = needsWater.count + needsFertilizer.count
        let overdueWaterCount = needsWater.filter { $0.wateringStatus == .overdue }.count
        let allCaughtUp = totalCareTasks == 0 && hasPlants

        if totalCareTasks == 0 && !allCaughtUp {
            EmptyView()
        } else if allCaughtUp {
            LeafbookCard {
                HStack(spacing: 12) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(Color.green)
                        .font(.title3)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("All caught up!")
                            .font(.headline)
                            .foregroundStyle(LeafbookColors.foreground)
                        Text("Your plants are well cared for. Maybe write a journal entry?")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    }
                }
            }
        } else {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Label("Needs Attention", systemImage: "leaf.fill")
                        .font(.system(.title3, design: .serif).weight(.semibold))
                    Spacer()
                    if overdueWaterCount > 0 {
                        DashboardCapsuleBadge(
                            label: "\(overdueWaterCount) thirsty",
                            systemImage: "drop.fill",
                            tint: LeafbookColors.waterBlue
                        )
                    }
                }

                if !needsWater.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Water", systemImage: "drop.fill")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                        LazyVStack(spacing: 8) {
                            ForEach(needsWater.prefix(6)) { task in
                                LeafbookCard(verticalPadding: 0, horizontalPadding: 0) {
                                    DashboardPlantTaskRow(
                                        plantId: task.plantId,
                                        plantName: task.plantName,
                                        thumbnailURL: DashboardUtils.getThumbnailUrl(
                                            plantId: task.plantId,
                                            photosByPlant: photosByPlantId
                                        ),
                                        statusText: waterStatusText(for: task),
                                        logTitle: "Water",
                                        logIcon: "drop",
                                        logTint: LeafbookColors.waterBlue,
                                        onLog: { onWater(task.plantId, $0) }
                                    )
                                }
                            }
                        }
                        if needsWater.count > 6 {
                            Text("+\(needsWater.count - 6) more plants need water")
                                .font(.caption)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                        }
                    }
                }

                if !needsFertilizer.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Fertilize", systemImage: "sparkles")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                        LazyVStack(spacing: 8) {
                            ForEach(needsFertilizer.prefix(3)) { task in
                                LeafbookCard(verticalPadding: 0, horizontalPadding: 0) {
                                    DashboardPlantTaskRow(
                                        plantId: task.plantId,
                                        plantName: task.plantName,
                                        thumbnailURL: DashboardUtils.getThumbnailUrl(
                                            plantId: task.plantId,
                                            photosByPlant: photosByPlantId
                                        ),
                                        statusText: fertilizerStatusText(for: task),
                                        logTitle: "Fertilize",
                                        logIcon: "sparkles",
                                        logTint: LeafbookColors.fertilizerAmber,
                                        onLog: { onFertilize(task.plantId, $0) }
                                    )
                                }
                            }
                        }
                        if needsFertilizer.count > 3 {
                            Text("+\(needsFertilizer.count - 3) more plants need fertilizer")
                                .font(.caption)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                        }
                    }
                }
            }
        }
    }

    private func waterStatusText(for task: PlantDueTask) -> String {
        switch task.wateringStatus {
        case .overdue:
            return "Last watered \(DashboardUtils.formatTimeAgo(task.lastWateredAt))"
        case .notStarted:
            return "Not tracked yet"
        case .dueSoon:
            return "Due soon"
        default:
            return "All set"
        }
    }

    private func fertilizerStatusText(for task: PlantDueTask) -> String {
        switch task.fertilizingStatus {
        case .overdue:
            return "Overdue"
        case .dueSoon:
            return "Due soon"
        default:
            return "All set"
        }
    }
}

#Preview {
    NavigationStack {
        CareTasksSectionView(
            tasks: [.preview],
            hasPlants: true,
            photosByPlantId: ["00000000-0000-0000-0000-000000000001": [.preview]],
            onWater: { _, _ in },
            onFertilize: { _, _ in }
        )
        .padding()
        .background(LeafbookColors.background)
    }
}
