//
//  DashboardJournalRow.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct DashboardJournalRow: View {
    let entry: JournalEntry
    let thumbnailURL: URL?

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            NavigationLink {
                PlantDetailView(plantId: entry.plantId)
            } label: {
                DashboardThumbnailView(url: thumbnailURL, size: 56)
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    NavigationLink {
                        PlantDetailView(plantId: entry.plantId)
                    } label: {
                        Text(entry.plant.name)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(LeafbookColors.primary)
                    }
                    .buttonStyle(.plain)

                    Text("·")
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.5))

                    Text(DashboardUtils.formatJournalDate(entry.entryDate))
                        .font(.caption)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                }

                if let title = entry.title, !title.isEmpty {
                    Text(title)
                        .font(.system(.subheadline, design: .serif).weight(.semibold))
                        .foregroundStyle(LeafbookColors.foreground)
                }

                Text(entry.content)
                    .font(.caption)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    .lineLimit(2)
            }

            Spacer()

            NavigationLink {
                JournalEntryDetailView(entry: entry)
            } label: {
                Text("View")
                    .font(.caption.weight(.semibold))
            }
            .buttonStyle(.bordered)
        }
    }
}

#Preview {
    NavigationStack {
        DashboardJournalRow(entry: .preview, thumbnailURL: URL(string: PlantPhoto.preview.url))
            .padding()
            .background(LeafbookColors.background)
    }
}
