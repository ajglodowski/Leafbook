//
//  WishlistView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/29/26.
//

import SwiftUI

struct WishlistView: View {
    var body: some View {
        ScrollView {
            EmptyStateView(
                title: "Wishlist coming soon",
                message: "This space will hold the plants you want to bring home next.",
                systemImage: "heart"
            )
            .padding(.top, 40)
        }
        .background(LeafbookColors.background)
        .navigationTitle("Wishlist")
    }
}

#Preview {
    NavigationStack {
        WishlistView()
    }
}
