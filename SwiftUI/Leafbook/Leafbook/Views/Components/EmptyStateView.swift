//
//  EmptyStateView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct EmptyStateView: View {
    let title: String
    let message: String
    let systemImage: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 32, weight: .light))
                .foregroundStyle(LeafbookColors.primary)
            Text(title)
                .font(.headline)
                .foregroundStyle(LeafbookColors.foreground)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity)
    }
}

#Preview {
    EmptyStateView(
        title: "No entries yet",
        message: "Your journal stays cozy while you take your time.",
        systemImage: "book"
    )
    .padding()
    .background(LeafbookColors.background)
}
