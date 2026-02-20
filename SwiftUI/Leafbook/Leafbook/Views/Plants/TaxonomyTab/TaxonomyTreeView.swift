//
//  TaxonomyTreeView.swift
//  Leafbook
//

import SwiftUI

struct TaxonomyTreeView: View {
    let tree: CompactedTaxonomyTree
    let photosById: [String: PlantPhoto]
    let photosByPlantId: [String: PlantPhoto]
    let plantTypesById: [String: PlantType]
    let onPlantTapped: (String) -> Void
    let onTypeTapped: ((PlantType) -> Void)?

    @State private var isUnclassifiedExpanded = false

    private var classifiedCount: Int {
        tree.totalPlants - tree.plantsWithoutTaxon.count
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            summaryRow

            ForEach(tree.roots) { root in
                CompactedNodeView(
                    node: root,
                    photosById: photosById,
                    photosByPlantId: photosByPlantId,
                    plantTypesById: plantTypesById,
                    depth: 0,
                    onPlantTapped: onPlantTapped,
                    onTypeTapped: onTypeTapped
                )
            }

            if !tree.plantsWithoutTaxon.isEmpty {
                unclassifiedSection
            }
        }
        .padding(16)
    }

    private var summaryRow: some View {
        HStack(spacing: 12) {
            Label("\(classifiedCount) classified", systemImage: "tree.fill")
                .font(.caption.weight(.medium))
                .foregroundStyle(LeafbookColors.foreground.opacity(0.7))

            if !tree.plantsWithoutTaxon.isEmpty {
                Label("\(tree.plantsWithoutTaxon.count) unclassified", systemImage: "questionmark.circle")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.5))
            }

            Spacer()
        }
        .padding(.bottom, 4)
    }

    private var unclassifiedSection: some View {
        DisclosureGroup(isExpanded: $isUnclassifiedExpanded) {
            VStack(alignment: .leading, spacing: 4) {
                ForEach(tree.plantsWithoutTaxon) { plant in
                    TaxonomyPlantCardView(
                        plant: plant,
                        thumbnailURL: thumbnailURL(for: plant),
                        onTapped: { onPlantTapped(plant.id) }
                    )
                }
            }
        } label: {
            HStack(spacing: 8) {
                Text("Unclassified")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))

                Spacer()

                Text("\(tree.plantsWithoutTaxon.count)")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
            }
        }
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
