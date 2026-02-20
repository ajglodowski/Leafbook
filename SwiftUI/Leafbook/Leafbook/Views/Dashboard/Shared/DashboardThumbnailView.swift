//
//  DashboardThumbnailView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/29/26.
//

import SwiftUI

struct DashboardThumbnailView: View {
    let url: URL?
    let size: CGFloat

    init(url: URL?, size: CGFloat = 40) {
        self.url = url
        self.size = size
    }

    var body: some View {
        Group {
            if let url {
                CachedAsyncImage(url: url)
            } else {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(LeafbookColors.muted.opacity(0.5))
                    Image(systemName: "leaf")
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                }
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

#Preview {
    DashboardThumbnailView(url: URL(string: PlantPhoto.preview.url))
        .padding()
        .background(LeafbookColors.background)
}
