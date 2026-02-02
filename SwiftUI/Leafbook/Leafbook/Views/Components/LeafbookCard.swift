//
//  LeafbookCard.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct LeafbookCard<Content: View>: View {
    let content: Content
    let verticalPadding: CGFloat
    let horizontalPadding: CGFloat

    init(
        verticalPadding: CGFloat? = nil,
        horizontalPadding: CGFloat? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.verticalPadding = verticalPadding ?? 16
        self.horizontalPadding = horizontalPadding ?? 16
    }

    var body: some View {
        content
            .padding(.vertical, verticalPadding)
            .padding(.horizontal, horizontalPadding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(LeafbookColors.card)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(LeafbookColors.muted.opacity(0.4), lineWidth: 1)
            )
    }
}

#Preview {
    LeafbookCard {
        VStack(alignment: .leading, spacing: 8) {
            Text("Morning check-in")
                .font(.headline)
            Text("Ready for a quick scan of today's care tasks.")
                .font(.subheadline)
        }
    }
    .padding()
    .background(LeafbookColors.background)
}
