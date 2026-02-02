//
//  DashboardCapsuleBadge.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/29/26.
//

import SwiftUI

struct DashboardCapsuleBadge: View {
    let label: String
    let systemImage: String
    let tint: Color

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: systemImage)
            Text(label)
                .font(.caption.weight(.semibold))
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(tint.opacity(0.18))
        .foregroundStyle(tint)
        .clipShape(Capsule())
    }
}

#Preview {
    DashboardCapsuleBadge(label: "2 upcoming", systemImage: "drop.fill", tint: LeafbookColors.waterBlue)
        .padding()
        .background(LeafbookColors.background)
}
