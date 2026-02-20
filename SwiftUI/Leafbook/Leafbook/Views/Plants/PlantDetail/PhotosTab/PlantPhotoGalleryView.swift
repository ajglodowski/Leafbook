//
//  PlantPhotoGalleryView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/4/26.
//

import SwiftUI

struct PlantPhotoGalleryView: View {
    let photos: [PlantPhoto]
    let startIndex: Int

    @Environment(\.dismiss) private var dismiss
    @State private var selectedIndex: Int

    init(photos: [PlantPhoto], startIndex: Int) {
        self.photos = photos
        self.startIndex = startIndex
        let upperBound = max(photos.count - 1, 0)
        let safeIndex = min(max(startIndex, 0), upperBound)
        _selectedIndex = State(initialValue: safeIndex)
    }

    var body: some View {
        ZStack {
            Color.black.opacity(0.95)
                .ignoresSafeArea()

#if os(iOS)
            TabView(selection: $selectedIndex) {
                ForEach(photos.indices, id: \.self) { index in
                    galleryImage(for: photos[index])
                        .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .automatic))
#else
            ZStack {
                if let photo = currentPhoto {
                    galleryImage(for: photo)
                }

                HStack {
                    Button(action: moveToPrevious) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(.white)
                            .padding(10)
                            .background(Color.black.opacity(0.5))
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .opacity(selectedIndex > 0 ? 1 : 0.2)
                    .disabled(selectedIndex == 0)

                    Spacer()

                    Button(action: moveToNext) {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(.white)
                            .padding(10)
                            .background(Color.black.opacity(0.5))
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .opacity(selectedIndex < photos.count - 1 ? 1 : 0.2)
                    .disabled(selectedIndex >= photos.count - 1)
                }
                .padding(.horizontal, 24)
            }
#endif

            VStack {
                HStack {
                    Spacer()
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(.white)
                            .padding(10)
                            .background(Color.black.opacity(0.5))
                            .clipShape(Circle())
                    }
#if os(macOS)
                    .buttonStyle(.plain)
#endif
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)

                Spacer()

                VStack(spacing: 6) {
                    Text(formatPolaroidDate(currentPhoto?.takenAt))
                        .font(.system(.subheadline, design: .serif).weight(.semibold))
                        .foregroundStyle(.white)

                    if let caption = currentPhoto?.caption,
                       !caption.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        Text(caption)
                            .font(.system(.footnote, design: .serif))
                            .foregroundStyle(.white.opacity(0.85))
                    }
                }
                .padding(.bottom, 24)
            }
        }
    }

    @ViewBuilder
    private func galleryImage(for photo: PlantPhoto) -> some View {
        AsyncImage(url: URL(string: photo.url)) { phase in
            switch phase {
            case .empty:
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            case .success(let image):
                image
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            case .failure:
                Image(systemName: "photo")
                    .font(.largeTitle)
                    .foregroundStyle(.white.opacity(0.5))
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            @unknown default:
                EmptyView()
            }
        }
        .id(photo.id)
    }

    private var currentPhoto: PlantPhoto? {
        guard photos.indices.contains(selectedIndex) else { return nil }
        return photos[selectedIndex]
    }

    private func moveToNext() {
        guard selectedIndex + 1 < photos.count else { return }
        withAnimation(.easeInOut(duration: 0.2)) {
            selectedIndex += 1
        }
    }

    private func moveToPrevious() {
        guard selectedIndex - 1 >= 0 else { return }
        withAnimation(.easeInOut(duration: 0.2)) {
            selectedIndex -= 1
        }
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
    PlantPhotoGalleryView(photos: [.preview, .preview], startIndex: 0)
}
