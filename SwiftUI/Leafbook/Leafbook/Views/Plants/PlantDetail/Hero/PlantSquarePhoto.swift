//
//  PlantSquarePhoto.swift
//  Leafbook
//

import SwiftUI

struct PlantSquarePhoto: View {
    let photo: PlantPhoto?
    let size: CGFloat
    var cornerRadius: CGFloat = 14
    var photoCount: Int = 1

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            if let urlString = photo?.url,
               let url = URL(string: urlString),
               !urlString.isEmpty {
                CachedAsyncImage(url: url)
                    .frame(width: size, height: size)
                    .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            } else {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(LeafbookColors.muted.opacity(0.35))
                    .frame(width: size, height: size)
                    .overlay {
                        VStack(spacing: 6) {
                            Image(systemName: "leaf.fill")
                                .font(.system(size: size * 0.16))
                                .foregroundStyle(LeafbookColors.primary.opacity(0.3))
                            Text("No photo")
                                .font(.caption2)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.35))
                        }
                    }
            }

            if photoCount > 1 {
                HStack(spacing: 3) {
                    Image(systemName: "photo.on.rectangle")
                        .font(.system(size: 9))
                    Text("\(photoCount)")
                        .font(.system(size: 10, weight: .semibold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(.black.opacity(0.5))
                .clipShape(Capsule())
                .padding(6)
            }
        }
    }
}
