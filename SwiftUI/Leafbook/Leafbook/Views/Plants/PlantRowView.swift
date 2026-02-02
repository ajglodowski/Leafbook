//
//  PlantRowView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct PlantRowView: View {
    private let model: PlantRowDisplayModel

    init(plant: Plant, taskStatus: PlantDueTask?, thumbnailURL: URL?) {
        self.model = PlantRowDisplayModel(
            plant: plant,
            taskStatus: taskStatus,
            thumbnailURL: thumbnailURL
        )
    }

    var body: some View {
        LeafbookCard(verticalPadding: 0, horizontalPadding: 0) {
            HStack(alignment: .center, spacing: 16) {
                thumbnail

                VStack(alignment: .leading, spacing: 8) {
                    header
                    detailStack
                    taskBadges
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.trailing, 16)
            }
        }
    }

    private var thumbnail: some View {
        Group {
            if let url = model.thumbnailURL {
                CachedAsyncImage(url: url)
            } else {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(LeafbookColors.muted.opacity(0.6))
            }
        }
        .frame(width: 144, height: 144)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private var header: some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            VStack(alignment: .leading, spacing: 4) {
                Text(model.name)
                    .font(.system(.title3, design: .serif).weight(.semibold))
                    .foregroundStyle(LeafbookColors.foreground)
                    .lineLimit(1)

                if let nickname = model.nickname {
                    Text("\"\(nickname)\"")
                        .font(.subheadline)
                        .italic()
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                        .lineLimit(1)
                }
                
                LeafbookBadge(
                    label: model.locationBadge.label,
                    systemImage: model.locationBadge.systemImage,
                    style: .muted
                )
            }

            
        }
    }

    private var detailStack: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let plantTypeName = model.plantTypeName {
                let baseText = Text(plantTypeName)
                let detailText = model.scientificName.map { Text(" · \($0)").italic() } ?? Text("")

                (baseText + detailText)
                    .font(.subheadline)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    .lineLimit(1)
            }

            if let location = model.locationLine {
                Label(location, systemImage: "mappin.and.ellipse")
                    .font(.caption)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                    .lineLimit(1)
            }
        }
    }

    private var taskBadges: some View {
        Group {
            if !model.taskBadges.isEmpty {
                HStack(spacing: 6) {
                    ForEach(model.taskBadges, id: \.label) { badge in
                        LeafbookBadge(
                            label: badge.label,
                            systemImage: badge.systemImage,
                            style: badge.isCritical ? .critical : .muted
                        )
                    }
                }
            }
        }
    }
}

private struct LeafbookBadge: View {
    enum Style {
        case muted
        case critical
    }

    let label: String
    let systemImage: String
    let style: Style

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: systemImage)
            Text(label)
                .multilineTextAlignment(.center)
        }
        .foregroundStyle(foregroundColor)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .font(.caption2.weight(.medium))
        .background(backgroundColor)
        .clipShape(Capsule())
            
    }

    private var backgroundColor: Color {
        switch style {
        case .critical:
            return Color.red.opacity(0.2)
        case .muted:
            return LeafbookColors.muted.opacity(0.7)
        }
    }

    private var foregroundColor: Color {
        switch style {
        case .critical:
            return Color.red
        case .muted:
            return LeafbookColors.foreground.opacity(0.85)
        }
    }
}

#Preview {
    VStack(spacing: 32) {
        PlantRowView(
            plant: .preview,
            taskStatus: .preview,
            thumbnailURL: URL(string: PlantPhoto.preview.url)
        )
        PlantRowView(
            plant: Plant(
                id: "plant-2",
                name: "Rubber tree",
                nickname: nil,
                plantLocation: "outdoor",
                location: "Balcony",
                lightExposure: nil,
                sizeCategory: nil,
                isActive: true,
                isLegacy: false,
                legacyReason: nil,
                legacyAt: nil,
                createdAt: nil,
                acquiredAt: nil,
                howAcquired: nil,
                description: nil,
                plantTypeId: nil,
                activePhotoId: nil,
                currentPotId: nil,
                parentPlantId: nil,
                plantTypes: PlantType(
                    id: "type-2",
                    name: "Ficus elastica",
                    scientificName: "Ficus elastica",
                    wateringFrequencyDays: nil,
                    fertilizingFrequencyDays: nil,
                    lightMin: nil,
                    lightMax: nil,
                    description: nil
                )
            ),
            taskStatus: PlantDueTask(
                plantId: "plant-2",
                plantName: "Rubber tree",
                plantTypeName: "Ficus elastica",
                wateringStatus: .overdue,
                wateringFrequencyDays: 10,
                lastWateredAt: "2026-01-10T12:00:00Z",
                waterDueAt: "2026-01-20T12:00:00Z",
                fertilizingStatus: .dueSoon,
                fertilizingFrequencyDays: 30,
                lastFertilizedAt: "2026-01-01T12:00:00Z",
                fertilizeDueAt: "2026-02-01T12:00:00Z"
            ),
            thumbnailURL: nil
        )
    }
    .padding()
    .background(LeafbookColors.background)
}
