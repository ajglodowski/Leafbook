//
//  PlantDetailNotesTab.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantDetailNotesTab: View {
    let description: String?

    var body: some View {
        VStack(spacing: 16) {
            LeafbookCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("My notes")
                        .font(.headline)
                    if let description, !description.isEmpty {
                        Text(description)
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.8))
                    } else {
                        Text("No notes yet. Capture a little memory here.")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    PlantDetailNotesTab(description: Plant.preview.description)
        .padding()
        .background(LeafbookColors.background)
}
