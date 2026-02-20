//
//  PlantBadge.swift
//  Leafbook
//

import SwiftUI

struct PlantBadge: View {
    let icon: String
    let text: String
    var iconColor: Color = LeafbookColors.foreground
    var backgroundColor: Color = LeafbookColors.muted.opacity(0.6)

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 10))
                .foregroundStyle(iconColor)
            Text(text)
                .font(.caption2.weight(.medium))
                .foregroundStyle(LeafbookColors.foreground.opacity(0.8))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(backgroundColor)
        .clipShape(Capsule())
    }
}
