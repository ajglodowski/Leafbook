//
//  PlantDetailPhotosTab.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantDetailPhotosTab: View {
    let photos: [PlantPhoto]

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    var body: some View {
        VStack(spacing: 16) {
            if photos.isEmpty {
                EmptyStateView(
                    title: "No photos yet",
                    message: "Add a snapshot the next time you notice new growth.",
                    systemImage: "photo"
                )
                .padding(.top, 24)
            } else {
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(photos) { photo in
                        CachedAsyncImage(url: URL(string: photo.url))
                            .aspectRatio(1, contentMode: .fill)
                            .frame(maxWidth: .infinity)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

#Preview {
    PlantDetailPhotosTab(photos: [.preview, .preview])
        .padding()
        .background(LeafbookColors.background)
}
