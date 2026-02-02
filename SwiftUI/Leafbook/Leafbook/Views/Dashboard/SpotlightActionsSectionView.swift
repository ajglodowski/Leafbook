//
//  SpotlightActionsSectionView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/29/26.
//

import SwiftUI

struct SpotlightActionsSectionView: View {
    let plants: [DashboardSpotlightPlant]
    let hasPlants: Bool

    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    private var spotlightPlant: DashboardSpotlightPlant? {
        guard hasPlants, !plants.isEmpty else { return nil }
        let index = Calendar.current.component(.day, from: Date()) % plants.count
        return plants[index]
    }

    var body: some View {
        if hasPlants {
            if horizontalSizeClass == .compact {
                VStack(spacing: 12) {
                    spotlightPlantSection
                    QuickActionsPanelView(hasPlants: hasPlants)
                }
            } else {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    spotlightPlantSection
                    QuickActionsPanelView(hasPlants: hasPlants)
                }
            }
        } else {
            EmptyView()
        }
    }

    @ViewBuilder
    private var spotlightPlantSection: some View {
        if let spotlightPlant {
            LeafbookCard {
                VStack(alignment: .leading, spacing: 12) {
                    Label("Plant Spotlight", systemImage: "camera")
                        .font(.headline)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.8))

                    Text(DashboardUtils.getSpotlightMessage(plant: spotlightPlant))
                        .font(.subheadline)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                        .italic()

                    HStack(alignment: .top, spacing: 12) {
                        if let photoUrl = spotlightPlant.photoUrl {
                            DashboardThumbnailView(url: URL(string: photoUrl), size: 80)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }

                        VStack(alignment: .leading, spacing: 4) {
                            NavigationLink {
                                PlantDetailView(plantId: spotlightPlant.id)
                            } label: {
                                Text(spotlightPlant.name)
                                    .font(.system(.title3, design: .serif).weight(.semibold))
                                    .foregroundStyle(LeafbookColors.foreground)
                            }
                            .buttonStyle(.plain)

                            if let plantType = spotlightPlant.plantTypeName {
                                Text(plantType)
                                    .font(.caption)
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                            }

                            if let description = spotlightPlant.description {
                                Text(description)
                                    .font(.caption)
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                                    .lineLimit(2)
                            }
                        }
                    }

                    HStack(spacing: 12) {
                        NavigationLink {
                            PlantDetailView(plantId: spotlightPlant.id)
                        } label: {
                            Text("View")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)

                        NavigationLink {
                            TimelineListView()
                        } label: {
                            Label("Timeline", systemImage: "clock")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .font(.subheadline.weight(.semibold))
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        SpotlightActionsSectionView(plants: [.preview], hasPlants: true)
            .padding()
            .background(LeafbookColors.background)
    }
}
