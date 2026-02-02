//
//  DashboardStatView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct DashboardStatView: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.title2.weight(.semibold))
                .foregroundStyle(LeafbookColors.foreground)
            Text(title)
                .font(.caption)
                .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(LeafbookColors.muted.opacity(0.5))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

#Preview {
    DashboardStatView(title: "Active plants", value: "12")
        .padding()
        .background(LeafbookColors.background)
}
