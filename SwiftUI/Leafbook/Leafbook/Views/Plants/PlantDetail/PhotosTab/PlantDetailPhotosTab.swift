//
//  PlantDetailPhotosTab.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantDetailPhotosTab: View {
    let photos: [PlantPhoto]
    let plantName: String
    let activePhotoId: String?
    let onUpdatePhoto: (PlantPhoto, Date, String?) async -> String?
    let onUploadPhoto: ((Data, Date, String?) async -> String?)?

    @State private var selectedGalleryIndex = 0
    @State private var showingGallery = false
    @State private var photoToEdit: PlantPhoto?
    @State private var showingUploadSheet = false

    private let cardWidth: CGFloat = 150
    private let gridSpacing: CGFloat = 24

    var body: some View {
        VStack(spacing: 16) {
            if photos.isEmpty {
                emptyPolaroid
            } else {
                if let featuredPhoto {
                    PolaroidPhotoCard(
                        photo: featuredPhoto,
                        rotation: .zero,
                        isFeatured: true,
                        showTape: false,
                        onTap: { openGallery(for: featuredPhoto) },
                        onEdit: { photoToEdit = featuredPhoto }
                    )
                    .frame(maxWidth: 300)
                    .frame(maxWidth: .infinity, alignment: .center)

                    // Show add button when upload is available and there are no other photos
                    if onUploadPhoto != nil && otherPhotos.isEmpty {
                        Button {
                            showingUploadSheet = true
                        } label: {
                            Label("Add Photo", systemImage: "plus.circle.fill")
                                .font(.system(.subheadline, design: .serif).weight(.semibold))
                        }
                        .buttonStyle(.bordered)
                        .tint(LeafbookColors.primary)
                        .padding(.top, 16)
                    }
                }

                if !otherPhotos.isEmpty {
                    HStack {
                        Text("More memories (\(otherPhotos.count))")
                            .font(.system(.subheadline, design: .serif).weight(.semibold))
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                        Spacer()
                        if onUploadPhoto != nil {
                            Button {
                                showingUploadSheet = true
                            } label: {
                                Image(systemName: "plus.circle.fill")
                                    .font(.title3)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, 20)
                    .padding(.top, 12)

                    LazyVGrid(
                        columns: [
                            GridItem(.flexible(), spacing: gridSpacing),
                            GridItem(.flexible(), spacing: gridSpacing)
                        ],
                        spacing: gridSpacing
                    ) {
                        ForEach(Array(otherPhotos.enumerated()), id: \.element.id) { index, photo in
                            PolaroidPhotoCard(
                                photo: photo,
                                rotation: rotation(for: photo, index: index),
                                isFeatured: false,
                                showTape: true,
                                onTap: { openGallery(for: photo) },
                                onEdit: { photoToEdit = photo }
                            )
                            .frame(maxWidth: cardWidth)
                            .padding(.vertical, 10)
                        }
                    }
                    .padding(.horizontal, 8)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .center)
#if os(iOS)
        .fullScreenCover(isPresented: $showingGallery) {
            PlantPhotoGalleryView(photos: photos, startIndex: selectedGalleryIndex)
        }
#else
        .sheet(isPresented: $showingGallery) {
            PlantPhotoGalleryView(photos: photos, startIndex: selectedGalleryIndex)
                .frame(minWidth: 500, minHeight: 500)
        }
#endif
        .sheet(item: $photoToEdit) { photo in
            PlantPhotoEditSheet(photo: photo) { takenAt, caption in
                await onUpdatePhoto(photo, takenAt, caption)
            }
        }
        .sheet(isPresented: $showingUploadSheet) {
            if let onUploadPhoto {
                PlantPhotoUploadSheet(plantName: plantName, onUpload: onUploadPhoto)
            }
        }
    }

    private var featuredPhoto: PlantPhoto? {
        if let activePhotoId {
            return photos.first(where: { $0.id == activePhotoId }) ?? photos.first
        }
        return photos.first
    }

    private var otherPhotos: [PlantPhoto] {
        guard let featuredPhoto else { return photos }
        return photos.filter { $0.id != featuredPhoto.id }
    }

    private func openGallery(for photo: PlantPhoto) {
        guard let index = photos.firstIndex(where: { $0.id == photo.id }) else { return }
        selectedGalleryIndex = index
        showingGallery = true
    }

    private func rotation(for photo: PlantPhoto, index: Int) -> Angle {
        let hash = photo.id.unicodeScalars.reduce(0) { $0 + Int($1.value) }
        let rotations = [-3, -2, 2, 3, -2, 2]
        let rotation = rotations[(hash + index) % rotations.count]
        return .degrees(Double(rotation))
    }

    private var emptyPolaroid: some View {
        VStack(spacing: 16) {
            ZStack(alignment: .bottomLeading) {
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(LeafbookColors.card)
                    .frame(maxWidth: 260)
                    .overlay(
                        VStack(spacing: 0) {
                            Rectangle()
                                .fill(LeafbookColors.muted.opacity(0.6))
                                .aspectRatio(1, contentMode: .fit)
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Your first photo here!")
                                    .font(.system(.headline, design: .serif))
                                    .foregroundStyle(LeafbookColors.foreground)
                                Text("Capture a new leaf or a quiet moment with \(plantName).")
                                    .font(.footnote)
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                            }
                            .padding(12)
                        }
                    )
                    .shadow(color: .black.opacity(0.12), radius: 10, x: 0, y: 6)
            }

            if onUploadPhoto != nil {
                Button {
                    showingUploadSheet = true
                } label: {
                    Label("Add Photo", systemImage: "plus.circle.fill")
                        .font(.system(.subheadline, design: .serif).weight(.semibold))
                }
                .buttonStyle(.bordered)
                .tint(LeafbookColors.primary)
            } else {
                Text("Add a snapshot the next time you notice new growth.")
                    .font(.footnote)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 240)
            }
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(.top, 24)
    }
}

#Preview {
    PlantDetailPhotosTab(
        photos: [.preview, .preview],
        plantName: "Monstera deliciosa",
        activePhotoId: nil,
        onUpdatePhoto: { _, _, _ in nil },
        onUploadPhoto: { _, _, _ in nil }
    )
    .padding()
    .background(LeafbookColors.background)
}
