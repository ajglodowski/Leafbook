//
//  EmptyStateSectionView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/29/26.
//

import SwiftUI

struct EmptyStateSectionView: View {
    let hasPlants: Bool

    var body: some View {
        if hasPlants {
            EmptyView()
        } else {
            LeafbookCard {
                VStack(spacing: 16) {
                    EmptyStateView(
                        title: "Welcome to your plant journal",
                        message: "Add your first plant to start your collection. Track care with one tap, write journal entries, and build a story for every leaf.",
                        systemImage: "calendar.badge.checkmark"
                    )

                    HStack(spacing: 12) {
                        NavigationLink {
                            AddPlantView()
                        } label: {
                            Label("Add your first plant", systemImage: "plus")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)

                        NavigationLink {
                            PlantCatalogView()
                        } label: {
                            Label("Browse catalog", systemImage: "safari")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        EmptyStateSectionView(hasPlants: false)
            .padding()
            .background(LeafbookColors.background)
    }
}
