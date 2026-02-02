//
//  PlantDetailTypeTab.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantDetailTypeTab: View {
    let plantType: PlantType?

    var body: some View {
        LeafbookCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("Plant type")
                    .font(.headline)
                if let plantType {
                    Text(plantType.name)
                        .font(.subheadline.weight(.semibold))
                    if let scientific = plantType.scientificName {
                        Text(scientific)
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    }
                    if let description = plantType.description {
                        Text(description)
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.8))
                    }
                    typeDetailRow(label: "Water every", value: plantType.wateringFrequencyDays.map { "\($0) days" } ?? "—")
                    typeDetailRow(label: "Fertilize every", value: plantType.fertilizingFrequencyDays.map { "\($0) days" } ?? "—")
                } else {
                    Text("No plant type details yet.")
                        .font(.subheadline)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func typeDetailRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
            Spacer()
            Text(value)
                .font(.subheadline)
        }
    }
}

#Preview {
    PlantDetailTypeTab(plantType: .preview)
        .padding()
        .background(LeafbookColors.background)
}
