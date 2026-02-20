//
//  PlantDetailCareTab.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantDetailCareTab: View {
    let plant: Plant
    let isLegacy: Bool
    let dueTask: PlantDueTask?
    let carePreferences: PlantCarePreferences?
    let scheduleSuggestion: PlantScheduleSuggestion?
    let currentPot: PlantPot?
    let unusedPots: [PlantPot]
    let hasCustomCare: Bool
    let onWater: ((Date) -> Void)?
    let onFertilize: ((Date) -> Void)?
    let onEditCarePreferences: (() -> Void)?
    let onRepot: (() -> Void)?
    let onAcceptSuggestion: (() -> Void)?
    let onDismissSuggestion: (() -> Void)?

    private let quickActionHeight: CGFloat = 30

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if !isLegacy {
                LeafbookCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Quick care")
                            .font(.headline)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                if let onWater {
                                    CareLogButton(
                                        title: "Water",
                                        systemImage: "drop.fill",
                                        tint: LeafbookColors.waterBlue,
                                        onLog: onWater
                                    )
                                }
                                if let onFertilize {
                                    CareLogButton(
                                        title: "Feed",
                                        systemImage: "sparkles",
                                        tint: LeafbookColors.fertilizerAmber,
                                        onLog: onFertilize
                                    )
                                }
                                if let onRepot {
                                    Button {
                                        onRepot()
                                    } label: {
                                        Label("Repot", systemImage: "square.stack.3d.up.fill")
                                            .font(.caption.weight(.semibold))
                                            .foregroundStyle(LeafbookColors.foreground)
                                            .padding(.horizontal, 12)
                                            .frame(height: quickActionHeight)
                                    }
                                    .buttonStyle(.plain)
                                    .background(
                                        LinearGradient(
                                            colors: [
                                                LeafbookColors.primary.opacity(0.18),
                                                LeafbookColors.muted.opacity(0.6)
                                            ],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                }
                            }
                        }
                    }
                }
            }

            if !isLegacy, let dueTask {
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
                    HStack(spacing: 6) {
                        Text("Care rhythm")
                            .font(.headline)
                        if isLegacy {
                            Text("Historical")
                                .font(.caption2.weight(.medium))
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.5))
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(LeafbookColors.muted.opacity(0.5))
                                .clipShape(Capsule())
                        }
                    }
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

            if !isLegacy, let scheduleSuggestion {
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
        isLegacy: false,
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
