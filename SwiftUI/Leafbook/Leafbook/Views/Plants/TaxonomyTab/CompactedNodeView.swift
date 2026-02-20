//
//  CompactedNodeView.swift
//  Leafbook
//

import SwiftUI

struct CompactedNodeView: View {
    let node: CompactedTreeNode
    let photosById: [String: PlantPhoto]
    let photosByPlantId: [String: PlantPhoto]
    let plantTypesById: [String: PlantType]
    let depth: Int
    let onPlantTapped: (String) -> Void
    let onTypeTapped: ((PlantType) -> Void)?

    @State private var isExpanded = true

    private var pathLabel: String {
        node.path.map(\.displayName).joined(separator: " → ")
    }

    private var endpointRank: TaxonomicRank? {
        TaxonomicRank.from(node.path.last?.rank)
    }

    private var hasChildren: Bool { !node.children.isEmpty }
    private var hasPlants: Bool { !node.plants.isEmpty }

    var body: some View {
        DisclosureGroup(isExpanded: $isExpanded) {
            VStack(alignment: .leading, spacing: 4) {
                ForEach(node.children) { child in
                    CompactedNodeView(
                        node: child,
                        photosById: photosById,
                        photosByPlantId: photosByPlantId,
                        plantTypesById: plantTypesById,
                        depth: depth + 1,
                        onPlantTapped: onPlantTapped,
                        onTypeTapped: onTypeTapped
                    )
                }

                if hasPlants {
                    plantGroup
                }
            }
        } label: {
            nodeLabel
        }
        .padding(.leading, CGFloat(depth) * 8)
    }

    private var nodeLabel: some View {
        HStack(spacing: 8) {
            Text(pathLabel)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(LeafbookColors.foreground)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)

            Spacer()

            if let rank = endpointRank {
                Text(rank.displayLabel)
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.85))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(LeafbookColors.muted.opacity(0.7))
                    .clipShape(Capsule())
            }

            Text("\(node.plantCount)")
                .font(.caption.weight(.semibold))
                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
        }
    }

    private var plantGroup: some View {
        let grouped = Dictionary(grouping: node.plants) { $0.plantTypeName ?? "Unknown type" }
            .sorted { $0.key < $1.key }

        return VStack(alignment: .leading, spacing: 8) {
            ForEach(grouped, id: \.key) { typeName, plants in
                VStack(alignment: .leading, spacing: 4) {
                    let resolvedType = plants.first?.plantTypeId.flatMap { plantTypesById[$0] }

                    if let onTypeTapped, let resolvedType {
                        Button {
                            onTypeTapped(resolvedType)
                        } label: {
                            HStack(spacing: 4) {
                                Text(typeName)
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                                Image(systemName: "chevron.right")
                                    .font(.caption2)
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.4))
                            }
                        }
                        .buttonStyle(.plain)
                    } else {
                        Text(typeName)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                    }

                    ForEach(plants) { plant in
                        TaxonomyPlantCardView(
                            plant: plant,
                            thumbnailURL: thumbnailURL(for: plant),
                            onTapped: { onPlantTapped(plant.id) }
                        )
                    }
                }
                .padding(8)
                .background(LeafbookColors.muted.opacity(0.2))
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
        }
        .padding(.leading, 8)
    }

    private func thumbnailURL(for plant: TaxonomyPlantSummary) -> URL? {
        if let photoId = plant.activePhotoId,
           let photo = photosById[photoId],
           let url = URL(string: photo.url) {
            return url
        }
        guard let fallback = photosByPlantId[plant.id] else { return nil }
        return URL(string: fallback.url)
    }
}
