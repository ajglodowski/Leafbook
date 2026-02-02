//
//  PlantDetailCareTab.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantDetailCareTab: View {
    let plant: Plant
    let dueTask: PlantDueTask?
    let carePreferences: PlantCarePreferences?
    let scheduleSuggestion: PlantScheduleSuggestion?
    let currentPot: PlantPot?
    let unusedPots: [PlantPot]
    let hasCustomCare: Bool
    let onWater: (() -> Void)?
    let onFertilize: (() -> Void)?
    let onEditCarePreferences: (() -> Void)?
    let onRepot: (() -> Void)?
    let onAcceptSuggestion: (() -> Void)?
    let onDismissSuggestion: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if plant.isLegacy == false {
                LeafbookCard {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Quick care")
                            .font(.headline)
                        HStack(spacing: 12) {
                            Button("Log water") {
                                onWater?()
                            }
                            .buttonStyle(.borderedProminent)
                            Button("Log fertilizer") {
                                onFertilize?()
                            }
                            .buttonStyle(.bordered)
                        }
                        if let onRepot {
                            Button("Repot") {
                                onRepot()
                            }
                            .buttonStyle(.bordered)
                        }
                    }
                }
            }

            if let dueTask {
                LeafbookCard {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Care status")
                            .font(.headline)
                        Text(dueTask.summary)
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.8))
                    }
                }
            }

            LeafbookCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Care rhythm")
                        .font(.headline)
                    if let watering = carePreferences?.wateringFrequencyDays {
                        detailRow(label: "Water", value: "Every \(watering) days")
                    }
                    if let fertilizing = carePreferences?.fertilizingFrequencyDays {
                        detailRow(label: "Fertilize", value: "Every \(fertilizing) days")
                    }
                    if carePreferences == nil {
                        Text("No custom schedule yet.")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    }
                    if hasCustomCare {
                        Text("Custom schedule applied")
                            .font(.caption)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                    }
                    if let onEditCarePreferences {
                        Button("Update care preferences") {
                            onEditCarePreferences()
                        }
                        .buttonStyle(.bordered)
                    }
                }
            }

            if let scheduleSuggestion {
                LeafbookCard {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Schedule suggestion")
                            .font(.headline)
                        Text("Try watering every \(scheduleSuggestion.suggestedIntervalDays) days instead of \(scheduleSuggestion.currentIntervalDays).")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.8))
                        if let confidence = scheduleSuggestion.confidenceScore {
                            Text("Confidence \(Int(confidence * 100))%")
                                .font(.caption)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                        }
                        HStack(spacing: 12) {
                            if let onAcceptSuggestion {
                                Button("Accept") {
                                    onAcceptSuggestion()
                                }
                                .buttonStyle(.borderedProminent)
                            }
                            if let onDismissSuggestion {
                                Button("Not now") {
                                    onDismissSuggestion()
                                }
                                .buttonStyle(.bordered)
                            }
                        }
                    }
                }
            }

            LeafbookCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Current pot")
                        .font(.headline)
                    if let pot = currentPot {
                        Text(pot.name)
                            .font(.subheadline.weight(.semibold))
                        Text(potDetails(pot))
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    } else {
                        Text("Not in a pot yet.")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    }
                    if !unusedPots.isEmpty {
                        Text("\(unusedPots.count) unused pot\(unusedPots.count == 1 ? "" : "s") available.")
                            .font(.caption)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func detailRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
            Spacer()
            Text(value)
                .font(.subheadline)
        }
    }

    private func potDetails(_ pot: PlantPot) -> String {
        let parts = [
            pot.sizeInches.map { "\($0)" + "\"" },
            pot.material
        ]
        return parts.compactMap { $0 }.joined(separator: " · ")
    }
}

#Preview {
    PlantDetailCareTab(
        plant: .preview,
        dueTask: .preview,
        carePreferences: .preview,
        scheduleSuggestion: .preview,
        currentPot: .preview,
        unusedPots: [.preview],
        hasCustomCare: true,
        onWater: nil,
        onFertilize: nil,
        onEditCarePreferences: nil,
        onRepot: nil,
        onAcceptSuggestion: nil,
        onDismissSuggestion: nil
    )
    .padding()
    .background(LeafbookColors.background)
}
