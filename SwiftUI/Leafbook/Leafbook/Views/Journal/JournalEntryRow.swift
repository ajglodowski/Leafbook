//
//  JournalEntryRow.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct JournalEntryRow: View {
    let entry: JournalEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(entry.title ?? "Journal note")
                .font(.headline)
            Text(entry.plant.name)
                .font(.caption)
                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
            if entry.eventId != nil {
                Text("Linked to event")
                    .font(.caption2)
                    .foregroundStyle(LeafbookColors.primary)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    JournalEntryRow(entry: .preview)
        .padding()
        .background(LeafbookColors.background)
}
