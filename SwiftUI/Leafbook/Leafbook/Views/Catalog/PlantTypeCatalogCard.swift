//
//  PlantTypeCatalogCard.swift
//  Leafbook
//

import SwiftUI

struct PlantTypeCatalogCard: View {
    let plantType: PlantType
    let photoURL: URL?

    var body: some View {
        HStack(alignment: .center, spacing: 0) {
            // Photo — fixed square, center-cropped, all corners rounded
            Color.clear
                .frame(width: 110, height: 110)
                .overlay {
                    thumbnail
                }
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

            // Text content
            VStack(alignment: .leading, spacing: 4) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(plantType.name)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(LeafbookColors.foreground)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)

                    if let scientific = plantType.scientificName {
                        Text(scientific)
                            .font(.caption)
                            .italic()
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                            .lineLimit(1)
                    }
                }

                if let description = plantType.description {
                    Text(description)
                        .font(.caption)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                }

                let badges = attributeBadges
                if !badges.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 4) {
                            ForEach(badges, id: \.label) { badge in
                                PlantBadge(icon: badge.icon, text: badge.label)
                            }
                        }
                    }
                }
            }
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(height: 110)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(LeafbookColors.card)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(LeafbookColors.muted.opacity(0.4), lineWidth: 1)
        )
    }

    @ViewBuilder
    private var thumbnail: some View {
        if let url = photoURL {
            CachedAsyncImage(url: url)
        } else {
            Rectangle()
                .fill(LeafbookColors.muted.opacity(0.5))
                .overlay {
                    Image(systemName: "leaf")
                        .font(.system(size: 24, weight: .light))
                        .foregroundStyle(LeafbookColors.primary.opacity(0.6))
                }
        }
    }

    private struct BadgeInfo {
        let icon: String
        let label: String
    }

    private var attributeBadges: [BadgeInfo] {
        var badges: [BadgeInfo] = []
        if let waterDays = plantType.wateringFrequencyDays {
            badges.append(BadgeInfo(icon: "drop.fill", label: "\(waterDays)d"))
        }
        if let minLabel = PlantLightLevel.from(plantType.lightMin)?.label {
            badges.append(BadgeInfo(icon: "sun.max.fill", label: minLabel))
        }
        if let sizeLabel = PlantSize.from(plantType.sizeMin)?.label {
            badges.append(BadgeInfo(icon: "ruler", label: sizeLabel))
        }
        return badges
    }
}

#Preview("With Photo") {
    PlantTypeCatalogCard(
        plantType: PlantType(
            id: "1",
            name: "Monstera Deliciosa",
            scientificName: "Monstera deliciosa",
            wateringFrequencyDays: 7,
            fertilizingFrequencyDays: 14,
            lightMin: "medium",
            lightMax: "bright",
            sizeMin: "medium",
            sizeMax: "large",
            description: "A popular tropical houseplant known for its distinctive split leaves."
        ),
        photoURL: URL(string: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400")
    )
    .padding()
}

#Preview("No Photo") {
    PlantTypeCatalogCard(
        plantType: PlantType(
            id: "2",
            name: "Snake Plant",
            scientificName: "Dracaena trifasciata",
            wateringFrequencyDays: 14,
            fertilizingFrequencyDays: nil,
            lightMin: "low",
            lightMax: nil,
            description: nil
        ),
        photoURL: nil
    )
    .padding()
}

#Preview("Minimal") {
    PlantTypeCatalogCard(
        plantType: PlantType(
            id: "3",
            name: "Pothos",
            scientificName: nil,
            wateringFrequencyDays: nil,
            fertilizingFrequencyDays: nil,
            lightMin: nil,
            lightMax: nil,
            description: nil
        ),
        photoURL: nil
    )
    .padding()
}
