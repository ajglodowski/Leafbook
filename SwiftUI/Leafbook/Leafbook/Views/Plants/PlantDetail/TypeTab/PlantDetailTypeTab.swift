//
//  PlantDetailTypeTab.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantDetailTypeTab: View {
    let plantType: PlantType?
    var onTypeTapped: ((PlantType) -> Void)? = nil

    var body: some View {
        VStack(spacing: 16) {
            if let plantType {
                Button {
                    onTypeTapped?(plantType)
                } label: {
                    LeafbookCard {
                        VStack(alignment: .leading, spacing: 12) {
                            // Header row
                            HStack(alignment: .top, spacing: 10) {
                                ZStack {
                                    Circle()
                                        .fill(LeafbookColors.primary.opacity(0.12))
                                        .frame(width: 38, height: 38)
                                    Image(systemName: "leaf.fill")
                                        .font(.system(size: 17, weight: .semibold))
                                        .foregroundStyle(LeafbookColors.primary)
                                }

                                VStack(alignment: .leading, spacing: 3) {
                                    Text("Plant type")
                                        .font(.caption2.weight(.medium))
                                        .foregroundStyle(LeafbookColors.primary.opacity(0.8))
                                    Text(plantType.name)
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(LeafbookColors.foreground)
                                    if let scientific = plantType.scientificName {
                                        Text(scientific)
                                            .font(.caption)
                                            .italic()
                                            .foregroundStyle(LeafbookColors.foreground.opacity(0.55))
                                    }
                                }

                                Spacer(minLength: 0)
                            }

                            // Description
                            if let description = plantType.description {
                                Text(description)
                                    .font(.subheadline)
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.8))
                                    .fixedSize(horizontal: false, vertical: true)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }

                            // Care badges row
                            HStack(spacing: 8) {
                                if let waterDays = plantType.wateringFrequencyDays {
                                    careBadge(icon: "drop.fill", text: "Every \(waterDays)d", color: LeafbookColors.waterBlue)
                                }
                                if let fertDays = plantType.fertilizingFrequencyDays {
                                    careBadge(icon: "sparkles", text: "Feed \(fertDays)d", color: LeafbookColors.fertilizerAmber)
                                }
                                if let minLabel = PlantLightLevel.from(plantType.lightMin)?.label,
                                   let maxLabel = PlantLightLevel.from(plantType.lightMax)?.label {
                                    let text = minLabel == maxLabel ? minLabel : "\(minLabel) – \(maxLabel)"
                                    careBadge(icon: "sun.max.fill", text: text, color: Color(red: 0.92, green: 0.72, blue: 0.20))
                                } else if let minLabel = PlantLightLevel.from(plantType.lightMin)?.label {
                                    careBadge(icon: "sun.max.fill", text: "\(minLabel)+", color: Color(red: 0.92, green: 0.72, blue: 0.20))
                                }
                            }

                            // Footer
                            HStack {
                                Spacer()
                                Label("View type detail", systemImage: "chevron.right")
                                    .font(.caption)
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.35))
                            }
                        }
                    }
                }
                .buttonStyle(.plain)
            } else {
                LeafbookCard {
                    HStack(spacing: 10) {
                        ZStack {
                            Circle()
                                .fill(LeafbookColors.muted.opacity(0.6))
                                .frame(width: 38, height: 38)
                            Image(systemName: "leaf")
                                .font(.system(size: 17))
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.35))
                        }
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Plant type")
                                .font(.caption2.weight(.medium))
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.4))
                            Text("No type assigned yet.")
                                .font(.subheadline)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                        }
                        Spacer(minLength: 0)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func careBadge(icon: String, text: String, color: Color) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(color)
            Text(text)
                .font(.caption2.weight(.medium))
                .foregroundStyle(LeafbookColors.foreground.opacity(0.75))
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background(color.opacity(0.1))
        .clipShape(Capsule())
    }
}

#Preview {
    PlantDetailTypeTab(plantType: .preview)
        .padding()
        .background(LeafbookColors.background)
}
