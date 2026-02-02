//
//  PlantDetailOverviewTab.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantDetailOverviewTab: View {
    let plant: Plant
    let dueTask: PlantDueTask?
    let journalEntries: [JournalEntry]
    let activeIssuesCount: Int
    let onEditPlant: (() -> Void)?
    let onAddIssue: (() -> Void)?
    let onAddJournal: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            LeafbookCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Quick actions")
                        .font(.headline)
                    HStack(spacing: 12) {
                        if let onEditPlant {
                            Button("Edit plant") {
                                onEditPlant()
                            }
                            .buttonStyle(.bordered)
                        }
                        if let onAddJournal {
                            Button("Add journal") {
                                onAddJournal()
                            }
                            .buttonStyle(.bordered)
                        }
                    }
                    if let onAddIssue {
                        Button("Log issue") {
                            onAddIssue()
                        }
                        .buttonStyle(.bordered)
                    }
                }
            }

            LeafbookCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Quick facts")
                        .font(.headline)
                    detailRow(label: "Location", value: plant.location ?? "Not set")
                    detailRow(label: "Light", value: formattedLight(plant.lightExposure) ?? "Not set")
                    detailRow(label: "Size", value: formattedSize(plant.sizeCategory) ?? "Not set")
                    detailRow(label: "Acquired", value: formattedDate(plant.acquiredAt) ?? "Not set")
                    detailRow(label: "How", value: plant.howAcquired ?? "Not set")
                }
            }

            LeafbookCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Care status")
                        .font(.headline)
                    if let dueTask {
                        Text(dueTask.summary)
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.8))
                    } else {
                        Text("No schedule yet — set one to get reminders.")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    }
                    if activeIssuesCount > 0 {
                        Text("\(activeIssuesCount) active issue\(activeIssuesCount == 1 ? "" : "s")")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(LeafbookColors.foreground)
                    }
                }
            }

            LeafbookCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Recent journal notes")
                        .font(.headline)
                    if journalEntries.isEmpty {
                        Text("No notes yet for this plant.")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    } else {
                        ForEach(journalEntries) { entry in
                            DashboardJournalRow(entry: entry, thumbnailURL: nil)
                        }
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

    private func formattedDate(_ dateString: String?) -> String? {
        guard let dateString else { return nil }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        let date = formatter.date(from: dateString) ?? ISO8601DateFormatter().date(from: dateString)
        guard let resolvedDate = date else { return nil }
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: resolvedDate)
    }

    private func formattedLight(_ light: String?) -> String? {
        guard let light, !light.isEmpty else { return nil }
        let labels: [String: String] = [
            "dark": "Dark",
            "low_indirect": "Low indirect",
            "medium_indirect": "Medium indirect",
            "bright_indirect": "Bright indirect",
            "direct": "Direct"
        ]
        return labels[light] ?? light.replacingOccurrences(of: "_", with: " ").capitalized
    }

    private func formattedSize(_ size: String?) -> String? {
        guard let size, !size.isEmpty else { return nil }
        let labels: [String: String] = [
            "small": "Small",
            "medium": "Medium",
            "large": "Large",
            "extra_large": "Extra large"
        ]
        return labels[size] ?? size.replacingOccurrences(of: "_", with: " ").capitalized
    }
}

#Preview {
    PlantDetailOverviewTab(
        plant: .preview,
        dueTask: .preview,
        journalEntries: [.preview],
        activeIssuesCount: 1,
        onEditPlant: nil,
        onAddIssue: nil,
        onAddJournal: nil
    )
    .padding()
    .background(LeafbookColors.background)
}
