//
//  PlantDetailPropagationTab.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantDetailPropagationTab: View {
    let group: PropagationGroup
    let photosByPlantId: [String: PlantPhoto]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            LeafbookCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Parent plant")
                        .font(.headline)
                    if let parent = group.parentPlant {
                        plantRow(parent)
                    } else {
                        Text("No parent plant set.")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    }
                }
            }

            LeafbookCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Children")
                        .font(.headline)
                    if group.childrenPlants.isEmpty {
                        Text("No propagated children yet.")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    } else {
                        ForEach(group.childrenPlants) { child in
                            plantRow(child)
                        }
                    }
                }
            }

            LeafbookCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Available parents")
                        .font(.headline)
                    if group.availableParents.isEmpty {
                        Text("No other plants available.")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    } else {
                        ForEach(group.availableParents) { plant in
                            plantRow(plant)
                        }
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func plantRow(_ plant: PropagationPlant) -> some View {
        HStack(spacing: 12) {
            if let photoUrl = photosByPlantId[plant.id]?.url, let url = URL(string: photoUrl) {
                CachedAsyncImage(url: url)
                    .frame(width: 48, height: 48)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            } else {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(LeafbookColors.muted)
                    .frame(width: 48, height: 48)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(plant.displayName)
                    .font(.subheadline.weight(.semibold))
                if plant.isLegacy {
                    Text("Legacy")
                        .font(.caption)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                }
            }
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    PlantDetailPropagationTab(
        group: PropagationGroup(
            parentPlant: .previewParent,
            childrenPlants: [.previewChild],
            availableParents: [.previewParent]
        ),
        photosByPlantId: [:]
    )
    .padding()
    .background(LeafbookColors.background)
}
