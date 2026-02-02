//
//  JournalEntryDetailView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct JournalEntryDetailView: View {
    let entry: JournalEntry

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(entry.title ?? "Journal note")
                    .font(.title2.weight(.semibold))
                Text(entry.plant.name)
                    .font(.subheadline)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                if entry.eventId != nil {
                    Text("Linked to a care event")
                        .font(.caption)
                        .foregroundStyle(LeafbookColors.primary)
                }
                Text(entry.content)
                    .font(.body)
            }
            .padding()
        }
        .background(LeafbookColors.background)
        .navigationTitle("Entry")
    }
}

#Preview {
    NavigationStack {
        JournalEntryDetailView(entry: .preview)
    }
}
