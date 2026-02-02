//
//  RecentJournalSectionView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/29/26.
//

import SwiftUI

struct RecentJournalSectionView: View {
    let entries: [JournalEntry]
    let photosByPlantId: [String: [PlantPhoto]]

    var body: some View {
        if entries.isEmpty {
            EmptyView()
        } else {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Label("Recent Journal Entries", systemImage: "clock")
                        .font(.system(.title3, design: .serif).weight(.semibold))
                    Spacer()
                    NavigationLink {
                        TimelineListView(initialFeed: .journal)
                    } label: {
                        Text("View all")
                            .font(.subheadline.weight(.semibold))
                    }
                }

                VStack(spacing: 8) {
                    ForEach(entries) { entry in
                        LeafbookCard(verticalPadding: 10, horizontalPadding: 12) {
                            DashboardJournalRow(
                                entry: entry,
                                thumbnailURL: DashboardUtils.getThumbnailUrl(
                                    plantId: entry.plantId,
                                    photosByPlant: photosByPlantId
                                )
                            )
                        }
                    }
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        RecentJournalSectionView(
            entries: [.preview],
            photosByPlantId: ["00000000-0000-0000-0000-000000000001": [.preview]]
        )
        .padding()
        .background(LeafbookColors.background)
    }
}
