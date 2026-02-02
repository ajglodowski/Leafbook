//
//  AddPlantView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/29/26.
//

import SwiftUI

struct AddPlantView: View {
    var body: some View {
        ScrollView {
            EmptyStateView(
                title: "Plant creator coming soon",
                message: "You'll be able to add a new plant and its care routine here.",
                systemImage: "plus.circle"
            )
            .padding(.top, 40)
        }
        .background(LeafbookColors.background)
        .navigationTitle("Add Plant")
    }
}

#Preview {
    NavigationStack {
        AddPlantView()
    }
}
