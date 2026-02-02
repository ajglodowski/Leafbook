//
//  ScheduleSuggestionsSectionView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/29/26.
//

import SwiftUI

struct ScheduleSuggestionsSectionView: View {
    let suggestions: [DashboardScheduleSuggestion]
    let onAccept: (DashboardScheduleSuggestion) -> Void
    let onDismiss: (DashboardScheduleSuggestion) -> Void

    var body: some View {
        if suggestions.isEmpty {
            EmptyView()
        } else {
            LeafbookCard {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 8) {
                        Image(systemName: "sparkles")
                            .foregroundStyle(LeafbookColors.primary)
                        Text("Schedule suggestions")
                            .font(.headline)
                    }

                    ForEach(suggestions) { suggestion in
                        VStack(alignment: .leading, spacing: 6) {
                            NavigationLink {
                                PlantDetailView(plantId: suggestion.plantId)
                            } label: {
                                Text(suggestion.plantName)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(LeafbookColors.foreground)
                            }
                            .buttonStyle(.plain)
                            Text("Try watering every \(suggestion.suggestedIntervalDays) days instead of \(suggestion.currentIntervalDays).")
                                .font(.subheadline)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.75))
                            if let confidence = suggestion.confidenceScore {
                                Text("Confidence \(Int(confidence * 100))%")
                                    .font(.caption)
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                            }
                            HStack(spacing: 12) {
                                Button("Accept") {
                                    onAccept(suggestion)
                                }
                                .buttonStyle(.borderedProminent)

                                Button("Not now") {
                                    onDismiss(suggestion)
                                }
                                .buttonStyle(.bordered)
                            }
                        }
                        .padding(.vertical, 6)
                    }
                }
            }
        }
    }
}

#Preview {
    ScheduleSuggestionsSectionView(
        suggestions: [.preview],
        onAccept: { _ in },
        onDismiss: { _ in }
    )
    .padding()
    .background(LeafbookColors.background)
}
