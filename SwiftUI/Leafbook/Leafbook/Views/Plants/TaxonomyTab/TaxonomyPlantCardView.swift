//
//  TaxonomyPlantCardView.swift
//  Leafbook
//

import SwiftUI

struct TaxonomyPlantCardView: View {
    let plant: TaxonomyPlantSummary
    let thumbnailURL: URL?
    let onTapped: () -> Void

    var body: some View {
        Button(action: onTapped) {
            HStack(spacing: 8) {
                if let url = thumbnailURL {
                    CachedAsyncImage(url: url)
                        .frame(width: 32, height: 32)
                        .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                } else {
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .fill(LeafbookColors.muted.opacity(0.6))
                        .frame(width: 32, height: 32)
                        .overlay {
                            Image(systemName: "leaf.fill")
                                .font(.caption2)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.4))
                        }
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(plant.name)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(LeafbookColors.foreground)
                        .lineLimit(1)
                    if let nickname = plant.nickname, !nickname.isEmpty {
                        Text("\"\(nickname)\"")
                            .font(.caption)
                            .italic()
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                            .lineLimit(1)
                    }
                }

                Spacer()
            }
            .padding(.vertical, 4)
            .padding(.horizontal, 8)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
