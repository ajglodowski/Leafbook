//
//  CachedAsyncImage.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct CachedAsyncImage: View {
    let url: URL?
    let contentMode: ContentMode

    @StateObject private var loader = CachedImageLoader()

    init(url: URL?, contentMode: ContentMode = .fill) {
        self.url = url
        self.contentMode = contentMode
    }

    var body: some View {
        ZStack {
            if let image = loader.image {
                image
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
            } else {
                Rectangle()
                    .fill(LeafbookColors.muted.opacity(0.4))
                if loader.isLoading {
                    ProgressView()
                }
            }
        }
        .task {
            await loader.load(from: url)
        }
    }
}

#Preview {
    CachedAsyncImage(url: URL(string: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6"))
        .frame(height: 180)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .padding()
        .background(LeafbookColors.background)
}
