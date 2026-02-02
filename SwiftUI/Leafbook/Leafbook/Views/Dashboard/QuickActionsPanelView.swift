//
//  QuickActionsPanelView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/29/26.
//

import SwiftUI

struct QuickActionsPanelView: View {
    let hasPlants: Bool

    @EnvironmentObject private var sessionState: SessionState
    @StateObject private var journalViewModel = JournalViewModel()
    @State private var showingJournalEntry = false

    var body: some View {
        LeafbookCard {
            VStack(alignment: .leading, spacing: 12) {
                Label("Quick Actions", systemImage: "safari")
                    .font(.headline)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    NavigationLink {
                        AddPlantView()
                    } label: {
                        QuickActionButton(title: "Add Plant", systemImage: "plus")
                    }

                    NavigationLink {
                        PlantCatalogView()
                    } label: {
                        QuickActionButton(title: "Browse Catalog", systemImage: "safari")
                    }

                    Button {
                        showingJournalEntry = true
                    } label: {
                        QuickActionButton(title: "Create Journal Entry", systemImage: "square.and.pencil")
                    }
                    .disabled(!hasPlants)

                    NavigationLink {
                        WishlistView()
                    } label: {
                        QuickActionButton(title: "Wishlist", systemImage: "heart")
                    }
                }
            }
        }
        .sheet(isPresented: $showingJournalEntry) {
            JournalEntryFormView { plantId, title, content, date, eventId, _ in
                guard case let .signedIn(userId) = await sessionState.status else { return false }
                return await journalViewModel.createEntry(
                    userId: userId,
                    plantId: plantId,
                    title: title,
                    content: content,
                    entryDate: date,
                    eventId: eventId
                )
            }
        }
    }
}

private struct QuickActionButton: View {
    let title: String
    let systemImage: String

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: systemImage)
                .font(.title3)
            Text(title)
                .font(.caption.weight(.medium))
        }
        .frame(maxWidth: .infinity, minHeight: 60)
        .padding(.vertical, 8)
        .background(LeafbookColors.muted.opacity(0.5))
        .foregroundStyle(LeafbookColors.foreground)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

#Preview {
    NavigationStack {
        QuickActionsPanelView(hasPlants: true)
            .padding()
            .background(LeafbookColors.background)
    }
    .environmentObject(SessionState(isPreview: true))
}
