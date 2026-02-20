//
//  PlantHeroView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct PlantHeroView: View {
    let plant: Plant
    let photo: PlantPhoto?
    var dueTask: PlantDueTask?
    var photoCount: Int = 1
    var onWater: ((Date) -> Void)?
    var onFertilize: ((Date) -> Void)?
    var onMove: (() -> Void)?
    var onEdit: (() -> Void)?
    var onTypeTapped: ((PlantType) -> Void)? = nil

    private var isLegacy: Bool {
        plant.isLegacy ?? false
    }

    private var lightLabel: String? {
        return plant.lightExposure?.displayName
    }

    var body: some View {
        VStack(spacing: 0) {

            // ── Photo + info ──
            HStack(alignment: .center, spacing: 14) {
                plantPhotoView

                VStack(alignment: .leading, spacing: 6) {
                    // Name
                    Text(plant.name)
                        .font(.system(.title, design: .serif))
                        .fontWeight(.bold)
                        .foregroundStyle(LeafbookColors.foreground)
                        .lineLimit(2)

                    if let nickname = plant.nickname, !nickname.isEmpty {
                        Text("\u{201C}\(nickname)\u{201D}")
                            .font(.callout)
                            .italic()
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.55))
                    }

                    // Type
                    if let plantType = plant.plantTypes {
                        Button {
                            onTypeTapped?(plantType)
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "leaf")
                                    .font(.system(size: 11))
                                    .foregroundStyle(LeafbookColors.primary)
                                Text(plantType.name)
                                    .font(.subheadline)
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.65))
                                if let sci = plantType.scientificName, !sci.isEmpty {
                                    Text("·")
                                        .foregroundStyle(LeafbookColors.foreground.opacity(0.25))
                                    Text(sci)
                                        .font(.caption)
                                        .italic()
                                        .foregroundStyle(LeafbookColors.foreground.opacity(0.4))
                                }
                            }
                        }
                        .buttonStyle(.plain)
                    }

                    // Badges
                    badgesView

                    // Legacy details
                    if isLegacy {
                        legacyDetailsView
                    }

                    // Origin
                    originStoryView

                    // Care status inline
                    if let dueTask {
                        HStack(spacing: 16) {
                            HStack(spacing: 5) {
                                Image(systemName: "drop.fill")
                                    .font(.system(size: 12))
                                    .foregroundStyle(LeafbookColors.waterBlue)
                                Text(dueTask.wateringStatus?.displayText ?? "Not tracked")
                                    .font(.caption)
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                            }
                            HStack(spacing: 5) {
                                Image(systemName: "sparkles")
                                    .font(.system(size: 12))
                                    .foregroundStyle(LeafbookColors.fertilizerAmber)
                                Text(dueTask.fertilizingStatus?.displayText ?? "Not tracked")
                                    .font(.caption)
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                            }
                        }
                    }
                }
            }
            .padding(.vertical, 8)

            // ── Actions ──
            if !isLegacy {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        if let onEdit {
                            HStack(spacing: 0) {
                                Button(action: onEdit) {
                                    Label("Edit", systemImage: "pencil")
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(LeafbookColors.foreground.opacity(0.85))
                                        .padding(.horizontal, 12)
                                        .frame(height: 30)
                                }
                                .buttonStyle(.plain)
                            }
                            .background(LeafbookColors.card)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                        if let onWater {
                            CareLogButton(title: "Water", systemImage: "drop.fill", tint: LeafbookColors.waterBlue, onLog: onWater)
                        }
                        if let onFertilize {
                            CareLogButton(title: "Feed", systemImage: "sparkles", tint: LeafbookColors.fertilizerAmber, onLog: onFertilize)
                        }
                        if let onMove {
                            HStack(spacing: 0) {
                                Button(action: onMove) {
                                    Label("Move", systemImage: "location.fill")
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(.white)
                                        .padding(.horizontal, 12)
                                        .frame(height: 30)
                                }
                                .buttonStyle(.plain)
                            }
                            .background(LeafbookColors.primary)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }
                .background(LeafbookColors.muted.opacity(0.3))
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(LeafbookColors.card)
        )
    }

    // MARK: - Photo

    private var plantPhotoView: some View {
        PlantSquarePhoto(photo: photo, size: 160, cornerRadius: 14, photoCount: photoCount)
    }

    // MARK: - Badges

    private var badgesView: some View {
        FlowLayout(spacing: 6) {
            if isLegacy {
                PlantBadge(
                    icon: "archivebox.fill",
                    text: "Legacy",
                    iconColor: LeafbookColors.foreground.opacity(0.6),
                    backgroundColor: LeafbookColors.muted
                )
            }

            PlantBadge(
                icon: plant.plantLocation == .indoor ? "house.fill" : "tree.fill",
                text: plant.plantLocation == .indoor ? "Indoor" : "Outdoor",
                iconColor: plant.plantLocation == .indoor ? LeafbookColors.waterBlue : LeafbookColors.primary
            )

            if let location = plant.location, !location.isEmpty {
                PlantBadge(
                    icon: "mappin",
                    text: location,
                    iconColor: LeafbookColors.roseAccent
                )
            }

            if let lightLabel {
                PlantBadge(
                    icon: "sun.max.fill",
                    text: lightLabel,
                    iconColor: LeafbookColors.fertilizerAmber
                )
            }
        }
    }

    // MARK: - Origin Story

    @ViewBuilder
    private var originStoryView: some View {
        if plant.acquiredAt != nil || plant.howAcquired != nil {
            VStack {
                HStack {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 10))
                        .foregroundStyle(LeafbookColors.roseAccent.opacity(0.8))
                    
                    if let howAcquired = plant.howAcquired {
                        Text(howAcquired)
                            .font(.caption)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                    }
                }

                if let acquiredAt = plant.acquiredAt {
                    Text(formatRelativeDate(acquiredAt))
                        .font(.caption)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                }
            }
        }
    }

    // MARK: - Legacy Details

    @ViewBuilder
    private var legacyDetailsView: some View {
        VStack(alignment: .leading, spacing: 2) {
            if let reason = plant.legacyReason, !reason.isEmpty {
                HStack(spacing: 4) {
                    Image(systemName: "archivebox.fill")
                        .font(.system(size: 10))
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.5))
                    Text(reason)
                        .font(.caption)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                }
            }
            if let legacyAt = plant.legacyAt {
                Text("Since \(formatRelativeDate(legacyAt))")
                    .font(.caption)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.5))
            }
        }
    }

    // MARK: - Helpers

    private func formatRelativeDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        var date = formatter.date(from: dateString)
        if date == nil {
            formatter.formatOptions = [.withInternetDateTime]
            date = formatter.date(from: dateString)
        }
        guard let resolvedDate = date else { return dateString }

        let days = Calendar.current.dateComponents([.day], from: resolvedDate, to: Date()).day ?? 0

        if days < 30 { return "\(days) days ago" }
        if days < 365 {
            let months = days / 30
            return "\(months) month\(months > 1 ? "s" : "") ago"
        }
        let years = days / 365
        return "\(years) year\(years > 1 ? "s" : "") ago"
    }
}

#Preview {
    ScrollView {
        VStack(spacing: 20) {
            PlantHeroView(
                plant: .preview,
                photo: .preview,
                dueTask: .preview,
                photoCount: 5,
                onWater: { _ in },
                onFertilize: { _ in },
                onEdit: {}
            )

            // Empty photo state
            PlantHeroView(
                plant: Plant(
                    id: "test",
                    name: "Fiddle Leaf Fig",
                    nickname: nil,
                    plantLocation: .outdoor,
                    location: "Patio",
                    lightExposure: .direct,
                    sizeCategory: .large,
                    isActive: true,
                    isLegacy: false,
                    legacyReason: nil,
                    legacyAt: nil,
                    createdAt: nil,
                    acquiredAt: "2024-06-15T12:00:00Z",
                    howAcquired: "Gift from mom",
                    description: nil,
                    plantTypeId: nil,
                    activePhotoId: nil,
                    currentPotId: nil,
                    parentPlantId: nil,
                    plantTypes: nil
                ),
                photo: nil,
                onWater: { _ in },
                onEdit: {}
            )
        }
        .padding()
    }
    .background(LeafbookColors.background)
}
