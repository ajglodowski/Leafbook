//
//  PlantCatalogView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/29/26.
//

import SwiftUI

struct PlantCatalogView: View {
    var body: some View {
        ScrollView {
            EmptyStateView(
                title: "Catalog coming soon",
                message: "Browse plant profiles and care tips here once the catalog is ready.",
                systemImage: "leaf"
            )
            .padding(.top, 40)
        }
        .background(LeafbookColors.background)
        .navigationTitle("Catalog")
    }
}

#Preview {
    NavigationStack {
        PlantCatalogView()
    }
}
