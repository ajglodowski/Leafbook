//
//  PlantDetailPropagationTab.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantDetailPropagationTab: View {
    let plantName: String
    let isLegacy: Bool
    let group: PropagationGroup
    let photosByPlantId: [String: PlantPhoto]
    let onSetParent: @Sendable (String, Date?) async -> Bool
    let onClearParent: @Sendable () async -> Bool
    let onCreatePropagation: @Sendable (PropagationDraft) async -> String?
    let onSelectPlant: (String) -> Void

    @State private var isExpanded = false
    @State private var showingSetParent = false
    @State private var showingPropagation = false

    private var hasParent: Bool { group.parentPlant != nil }
    private var hasChildren: Bool { !group.childrenPlants.isEmpty }
    private var hasLineage: Bool { hasParent || hasChildren }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            LeafbookCard {
                VStack(alignment: .leading, spacing: 12) {
                    header

                    if isExpanded {
                        expandedContent
                    } else {
                        collapsedContent
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .sheet(isPresented: $showingSetParent) {
            SetParentPlantView(
                plantName: plantName,
                currentParent: group.parentPlant,
                availableParents: group.availableParents,
                onSave: { parentId, propagationDate in
                    await onSetParent(parentId, propagationDate)
                },
                onClear: {
                    await onClearParent()
                }
            )
        }
        .sheet(isPresented: $showingPropagation) {
            PropagatePlantView(
                parentPlantName: plantName,
                onCreate: { draft in
                    await onCreatePropagation(draft)
                },
                onCreated: { newPlantId in
                    onSelectPlant(newPlantId)
                }
            )
        }
    }

    private var header: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.triangle.branch")
                        .foregroundStyle(LeafbookColors.primary)
                    Text("Plant Lineage")
                        .font(.system(.title3, design: .serif).weight(.semibold))
                        .foregroundStyle(LeafbookColors.foreground)
                }

                Text("Track propagation relationships")
                    .font(.subheadline)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))

                HStack(spacing: 10) {
                    Button(hasParent ? "Change parent" : "Set parent") {
                        showingSetParent = true
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)

                    if !isLegacy {
                        Button("Propagate") {
                            showingPropagation = true
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.small)
                        .tint(LeafbookColors.primary)
                    }
                }
            }

            Spacer(minLength: 0)

            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isExpanded.toggle()
                }
            } label: {
                Image(systemName: isExpanded ? "chevron.down" : "chevron.right")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    .frame(width: 28, height: 28)
                    .background(LeafbookColors.muted.opacity(0.4))
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .contentShape(Rectangle())
                    .padding(4)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(isExpanded ? "Collapse plant lineage" : "Expand plant lineage")
        }
    }

    private var collapsedContent: some View {
        VStack(alignment: .leading, spacing: 12) {
            if hasLineage {
                if let parent = group.parentPlant {
                    HStack(spacing: 8) {
                        lineageLabel(text: "Parent", systemImage: "arrow.up")
                        lineagePlantRow(
                            parent,
                            badgeText: "Mother",
                            badgeStyle: .solid,
                            compact: true
                        )
                    }
                }

                if hasChildren {
                    HStack(spacing: 8) {
                        lineageLabel(text: "Children", systemImage: "arrow.down")
                        if group.childrenPlants.count == 1, let child = group.childrenPlants.first {
                            lineagePlantRow(
                                child,
                                badgeText: "Child",
                                badgeStyle: .outline,
                                compact: true
                            )
                        } else {
                            Button("\(group.childrenPlants.count) propagations · Tap to expand") {
                                withAnimation(.easeInOut(duration: 0.2)) {
                                    isExpanded = true
                                }
                            }
                            .font(.footnote)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .strokeBorder(style: StrokeStyle(lineWidth: 1, dash: [6, 4]))
                                    .foregroundStyle(LeafbookColors.muted.opacity(0.8))
                            )
                        }
                    }
                }
            } else {
                Button("No lineage yet · Tap to expand") {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        isExpanded = true
                    }
                }
                .font(.footnote)
                .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
            }
        }
    }

    private var expandedContent: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                lineageLabel(text: "Parent", systemImage: "arrow.up")

                if let parent = group.parentPlant {
                    lineagePlantRow(parent, badgeText: "Mother", badgeStyle: .solid, compact: false)
                } else {
                    emptyLineageCard(
                        title: "No parent plant linked yet",
                        message: "Was this plant propagated from another? Link it to track lineage."
                    )
                }
            }

            divider

            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    lineageLabel(text: "Children", systemImage: "arrow.down")
                    if hasChildren {
                        countBadge(count: group.childrenPlants.count)
                    }
                }

                if hasChildren {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(group.childrenPlants) { child in
                            lineagePlantRow(child, badgeText: "Child", badgeStyle: .outline, compact: false)
                        }
                    }
                } else {
                    emptyLineageCard(
                        title: "No propagations yet",
                        message: "Use the Propagate button to create a cutting from this plant."
                    )
                }
            }
        }
    }

    private var divider: some View {
        HStack(spacing: 8) {
            Rectangle()
                .fill(LeafbookColors.muted.opacity(0.6))
                .frame(height: 1)
            Text(plantName)
                .font(.caption.weight(.medium))
                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(LeafbookColors.card)
                .clipShape(Capsule())
            Rectangle()
                .fill(LeafbookColors.muted.opacity(0.6))
                .frame(height: 1)
        }
    }

    private func lineageLabel(text: String, systemImage: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: systemImage)
                .font(.caption.weight(.semibold))
            Text(text)
                .font(.caption.weight(.semibold))
        }
        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
    }

    private enum BadgeStyle {
        case solid
        case outline
    }

    private func lineagePlantRow(
        _ plant: PropagationPlant,
        badgeText: String,
        badgeStyle: BadgeStyle,
        compact: Bool
    ) -> some View {
        Button {
            onSelectPlant(plant.id)
        } label: {
            HStack(spacing: 12) {
                plantThumbnail(for: plant, compact: compact)

                VStack(alignment: .leading, spacing: 4) {
                    Text(plant.name)
                        .font(compact ? .footnote.weight(.semibold) : .subheadline.weight(.semibold))
                        .foregroundStyle(LeafbookColors.foreground)
                        .lineLimit(1)

                    if !compact, let nickname = plant.nickname, !nickname.isEmpty {
                        Text(nickname)
                            .font(.footnote)
                            .italic()
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                            .lineLimit(1)
                    }
                }

                Spacer(minLength: 0)

                lineageBadge(text: badgeText, style: badgeStyle)
            }
            .padding(compact ? 8 : 10)
            .background(LeafbookColors.card)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(LeafbookColors.muted.opacity(0.6), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private func plantThumbnail(for plant: PropagationPlant, compact: Bool) -> some View {
        let size: CGFloat = compact ? 32 : 48
        let cornerRadius: CGFloat = compact ? 8 : 12

        return Group {
            if let photoUrl = photosByPlantId[plant.id]?.url, let url = URL(string: photoUrl) {
                CachedAsyncImage(url: url)
                    .scaledToFill()
            } else {
                ZStack {
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(LeafbookColors.muted.opacity(0.6))
                    Image(systemName: "leaf")
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.5))
                }
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    }

    private func lineageBadge(text: String, style: BadgeStyle) -> some View {
        let foreground: Color = style == .solid ? LeafbookColors.foreground : LeafbookColors.primary
        let background: Color = style == .solid ? LeafbookColors.muted.opacity(0.7) : .clear
        let border = style == .outline

        return Text(text)
            .font(.caption2.weight(.semibold))
            .foregroundStyle(foreground)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(background)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(border ? LeafbookColors.muted.opacity(0.8) : .clear, lineWidth: 1)
            )
    }

    private func emptyLineageCard(title: String, message: String) -> some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(LeafbookColors.foreground.opacity(0.75))
            Text(message)
                .font(.footnote)
                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .padding(.horizontal, 12)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(style: StrokeStyle(lineWidth: 1, dash: [6, 4]))
                .foregroundStyle(LeafbookColors.muted.opacity(0.8))
        )
    }

    private func countBadge(count: Int) -> some View {
        Text("\(count)")
            .font(.caption.weight(.semibold))
            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(LeafbookColors.muted.opacity(0.6))
            .clipShape(Capsule())
    }
}

#Preview {
    PlantDetailPropagationTab(
        plantName: "Monstera",
        isLegacy: false,
        group: PropagationGroup(
            parentPlant: .previewParent,
            childrenPlants: [.previewChild],
            availableParents: [.previewParent]
        ),
        photosByPlantId: [:],
        onSetParent: { _, _ in true },
        onClearParent: { true },
        onCreatePropagation: { _ in "plant-2" },
        onSelectPlant: { _ in }
    )
    .padding()
    .background(LeafbookColors.background)
}
