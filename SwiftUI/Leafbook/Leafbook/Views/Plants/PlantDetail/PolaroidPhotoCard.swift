//
//  PolaroidPhotoCard.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/4/26.
//

import SwiftUI

struct PolaroidPhotoCard: View {
    let photo: PlantPhoto
    let rotation: Angle
    let isFeatured: Bool
    let showTape: Bool
    let onTap: () -> Void
    let onEdit: () -> Void

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button(action: onTap) {
            ZStack(alignment: .topTrailing) {
                VStack(spacing: 0) {
                    CachedAsyncImage(url: URL(string: photo.url))
                        .aspectRatio(1, contentMode: .fill)
                        .frame(maxWidth: .infinity)
                        .clipped()

                    VStack(alignment: .leading, spacing: 4) {
                        Text(formatPolaroidDate(photo.takenAt))
                            .font(isFeatured ? .system(.title3, design: .serif) : .system(.subheadline, design: .serif))
                            .foregroundStyle(polaroidInk)

                        if let caption = photo.caption, !caption.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            Text(caption)
                                .font(isFeatured ? .system(.headline, design: .serif) : .system(.footnote, design: .serif))
                                .foregroundStyle(polaroidInk.opacity(0.8))
                                .lineLimit(1)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, isFeatured ? 16 : 12)
                    .padding(.top, isFeatured ? 12 : 8)
                    .padding(.bottom, isFeatured ? 18 : 12)
                }
                .background(polaroidFrame)
                .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                .shadow(color: .black.opacity(colorScheme == .dark ? 0.35 : 0.12), radius: 12, x: 0, y: 8)

                Button(action: onEdit) {
                    Image(systemName: "pencil")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(polaroidInk)
                        .padding(8)
                        .background(polaroidFrame.opacity(0.95))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .padding(10)
            }
        }
        .buttonStyle(.plain)
        .rotationEffect(isFeatured ? .zero : rotation)
        .overlay(alignment: .top) {
            if showTape {
                RoundedRectangle(cornerRadius: 2, style: .continuous)
                    .fill(polaroidTape)
                    .frame(width: 42, height: 14)
                    .offset(y: -10)
                    .rotationEffect(.degrees(rotation.degrees * -0.5))
                    .shadow(color: .black.opacity(0.08), radius: 2, x: 0, y: 1)
            }
        }
    }

    private var polaroidFrame: Color {
        colorScheme == .dark
            ? Color(red: 0.92, green: 0.88, blue: 0.80)
            : Color(red: 0.98, green: 0.96, blue: 0.90)
    }

    private var polaroidInk: Color {
        colorScheme == .dark
            ? Color(red: 0.30, green: 0.26, blue: 0.22)
            : Color(red: 0.32, green: 0.28, blue: 0.24)
    }

    private var polaroidTape: Color {
        colorScheme == .dark
            ? Color(red: 0.86, green: 0.78, blue: 0.64).opacity(0.85)
            : Color(red: 0.90, green: 0.82, blue: 0.68).opacity(0.75)
    }

    private func formatPolaroidDate(_ dateString: String?) -> String {
        guard let dateString,
              let date = DashboardUtils.parseDate(dateString) else {
            return "Date unknown"
        }
        return Self.dateFormatter.string(from: date)
    }

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.setLocalizedDateFormatFromTemplate("MMM d, yyyy")
        return formatter
    }()
}

#Preview {
    VStack(spacing: 24) {
        PolaroidPhotoCard(
            photo: .preview,
            rotation: .degrees(3),
            isFeatured: true,
            showTape: false,
            onTap: {},
            onEdit: {}
        )

        PolaroidPhotoCard(
            photo: .preview,
            rotation: .degrees(-4),
            isFeatured: false,
            showTape: true,
            onTap: {},
            onEdit: {}
        )
        .frame(width: 160)
    }
    .padding()
    .background(LeafbookColors.background)
}
