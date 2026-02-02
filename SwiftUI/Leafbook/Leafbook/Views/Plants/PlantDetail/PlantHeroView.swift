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
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    private var lastWateredLabel: String {
        // TODO: Get actual last watered date from dueTask when available
        "Recently"
    }

    private var isLegacy: Bool {
        plant.isLegacy ?? false
    }

    private var lightLabel: String? {
        guard let light = plant.lightExposure else { return nil }
        let labels: [String: String] = [
            "dark": "Dark",
            "low_indirect": "Low Indirect",
            "medium_indirect": "Medium Indirect",
            "bright_indirect": "Bright Indirect",
            "direct": "Direct"
        ]
        return labels[light] ?? light.replacingOccurrences(of: "_", with: " ").capitalized
    }

    var body: some View {
        ZStack {
            // Background gradient
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            LeafbookColors.primary.opacity(0.08),
                            Color.clear,
                            LeafbookColors.fertilizerAmber.opacity(0.05)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            // Decorative blur circles
            Circle()
                .fill(LeafbookColors.primary.opacity(0.06))
                .frame(width: 140, height: 140)
                .blur(radius: 40)
                .offset(x: -80, y: -60)

            Circle()
                .fill(LeafbookColors.fertilizerAmber.opacity(0.08))
                .frame(width: 100, height: 100)
                .blur(radius: 30)
                .offset(x: 100, y: 80)

            VStack(alignment: .leading, spacing: 0) {
                // Last watered indicator
                HStack(spacing: 6) {
                    Image(systemName: "drop.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(LeafbookColors.waterBlue)
                    Text("Last watered \(lastWateredLabel)")
                        .font(.caption)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)

            // Main content
            heroContent
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    // MARK: - Photo View

    private var plantPhotoView: some View {
        ZStack {
            // Decorative gradient ring
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            LeafbookColors.primary.opacity(0.25),
                            LeafbookColors.fertilizerAmber.opacity(0.2)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 174, height: 174)
                .blur(radius: 4)

            // Photo container
            ZStack {
                if let urlString = photo?.url,
                   let url = URL(string: urlString),
                   !urlString.isEmpty {
                    CachedAsyncImage(url: url)
                } else {
                    // Empty state
                    VStack(spacing: 8) {
                        Image(systemName: "leaf.fill")
                            .font(.system(size: 32, weight: .medium))
                            .foregroundStyle(LeafbookColors.primary.opacity(0.35))
                        Text("No photo yet")
                            .font(.caption2)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.5))
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(
                        LinearGradient(
                            colors: [
                                LeafbookColors.primary.opacity(0.08),
                                LeafbookColors.muted.opacity(0.3)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                }
            }
            .frame(width: 160, height: 160)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(LeafbookColors.card, lineWidth: 3)
            )
            .shadow(color: LeafbookColors.foreground.opacity(0.1), radius: 8, x: 0, y: 4)

            // Photo count badge
            if photoCount > 1 {
                HStack(spacing: 3) {
                    Image(systemName: "camera.fill")
                        .font(.system(size: 9))
                    Text("\(photoCount)")
                        .font(.system(size: 10, weight: .semibold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(.black.opacity(0.6))
                .clipShape(Capsule())
                .offset(x: 50, y: 60)
            }
        }
    }

    // MARK: - Info View

    private var plantInfoView: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Plant name
            VStack(alignment: .leading, spacing: 4) {
                Text(plant.name)
                    .font(.system(.title, design: .serif))
                    .fontWeight(.semibold)
                    .foregroundStyle(LeafbookColors.foreground)

                if let nickname = plant.nickname, !nickname.isEmpty {
                    Text("\"\(nickname)\"")
                        .font(.callout)
                        .italic()
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                }
            }

            // Plant type
            if let plantType = plant.plantTypes {
                HStack(spacing: 4) {
                    Image(systemName: "leaf")
                        .font(.system(size: 12))
                        .foregroundStyle(LeafbookColors.primary.opacity(0.7))
                    Text(plantType.name)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.8))
                    if let scientificName = plantType.scientificName, !scientificName.isEmpty {
                        Text("(\(scientificName))")
                            .font(.caption)
                            .italic()
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.5))
                    }
                }
            }

            // Badges
            badgesView
                .padding(.top, 4)

            // Origin story
            originStoryView
                .padding(.top, 2)

            // Quick actions
            if !isLegacy {
                quickActionsView
                    .padding(.top, 8)
            }
        }
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
                icon: plant.plantLocation == "indoor" ? "house.fill" : "tree.fill",
                text: plant.plantLocation == "indoor" ? "Indoor" : "Outdoor",
                iconColor: plant.plantLocation == "indoor" ? LeafbookColors.waterBlue : LeafbookColors.primary
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
            HStack(spacing: 4) {
                Image(systemName: "heart.fill")
                    .font(.system(size: 10))
                    .foregroundStyle(LeafbookColors.roseAccent.opacity(0.8))

                if let howAcquired = plant.howAcquired {
                    Text(howAcquired)
                        .font(.caption)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.6))

                    if plant.acquiredAt != nil {
                        Text("·")
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.4))
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

    // MARK: - Quick Actions

    private var quickActionsView: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) {
                if let onEdit {
                    Button {
                        onEdit()
                    } label: {
                        Label("Edit", systemImage: "pencil")
                            .font(.caption.weight(.medium))
                    }
                    .buttonStyle(.bordered)
                    .tint(LeafbookColors.foreground.opacity(0.8))
                }
                
                if let onWater {
                    CareLogButton(
                        title: "Water",
                        systemImage: "drop.fill",
                        tint: LeafbookColors.waterBlue,
                        onLog: onWater
                    )
                    .controlSize(.small)
                }
                
                if let onFertilize {
                    CareLogButton(
                        title: "Feed",
                        systemImage: "sparkles",
                        tint: LeafbookColors.fertilizerAmber,
                        onLog: onFertilize
                    )
                    .controlSize(.small)
                }
                
                if let onMove {
                    Button {
                        onMove()
                    } label: {
                        Label("Move", systemImage: "location.fill")
                            .font(.caption.weight(.medium))
                    }
                    .buttonStyle(.bordered)
                    .tint(LeafbookColors.primary)
                }
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

    private var isCompactWidth: Bool {
        horizontalSizeClass == .compact
    }

    private var heroContent: some View {
        Group {
            if isCompactWidth {
                VStack(spacing: 16) {
                    plantPhotoView
                        .frame(maxWidth: .infinity, alignment: .center)
                    plantInfoView
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            } else {
                HStack(alignment: .top, spacing: 20) {
                    plantPhotoView
                    plantInfoView
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, 20)
    }
}

// MARK: - Plant Badge

struct PlantBadge: View {
    let icon: String
    let text: String
    var iconColor: Color = LeafbookColors.foreground
    var backgroundColor: Color = LeafbookColors.muted.opacity(0.6)

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 10))
                .foregroundStyle(iconColor)
            Text(text)
                .font(.caption2.weight(.medium))
                .foregroundStyle(LeafbookColors.foreground.opacity(0.8))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(backgroundColor)
        .clipShape(Capsule())
    }
}

// MARK: - Flow Layout for Badges

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = computeLayout(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = computeLayout(proposal: proposal, subviews: subviews)
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y), proposal: .unspecified)
        }
    }

    private func computeLayout(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var currentX: CGFloat = 0
        var currentY: CGFloat = 0
        var lineHeight: CGFloat = 0
        var totalHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)

            if currentX + size.width > maxWidth && currentX > 0 {
                currentX = 0
                currentY += lineHeight + spacing
                lineHeight = 0
            }

            positions.append(CGPoint(x: currentX, y: currentY))
            currentX += size.width + spacing
            lineHeight = max(lineHeight, size.height)
            totalHeight = currentY + lineHeight
        }

        return (CGSize(width: maxWidth, height: totalHeight), positions)
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
                    plantLocation: "outdoor",
                    location: "Patio",
                    lightExposure: "direct",
                    sizeCategory: "large",
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
