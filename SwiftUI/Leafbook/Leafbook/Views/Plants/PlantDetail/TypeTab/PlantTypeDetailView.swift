//
//  PlantTypeDetailView.swift
//  Leafbook
//

import SwiftUI

struct PlantTypeDetailView: View {
    let plantType: PlantType

    @EnvironmentObject private var sessionState: SessionState
    @State private var viewModel = PlantTypeDetailViewModel()
    @State private var hasLoaded = false
    @State private var selectedPhotoId: String?
    @State private var linkedPlantId: String?

    private var selectedPhoto: PlantTypePhoto? {
        if let id = selectedPhotoId {
            return viewModel.photos.first(where: { $0.id == id })
        }
        return viewModel.photos.first(where: { $0.isPrimary == true }) ?? viewModel.photos.first
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if !viewModel.photos.isEmpty {
                    photoGallery
                }
                headerCard
                if plantType.description != nil {
                    descriptionCard
                }
                careStatGrid
                plantsSection
            }
            .padding()
        }
        .background(LeafbookColors.background)
        .navigationTitle(plantType.name)
        .navigationDestination(item: $linkedPlantId) { plantId in
            PlantDetailView(plantId: plantId)
        }
        .task {
            guard !hasLoaded else { return }
            if case let .signedIn(userId) = sessionState.status {
                hasLoaded = true
                await viewModel.load(plantTypeId: plantType.id, userId: userId)
            }
        }
    }

    // MARK: - Photo Gallery

    private var photoGallery: some View {
        VStack(spacing: 8) {
            if let photo = selectedPhoto, let url = URL(string: photo.url) {
                Color.clear
                    .frame(maxWidth: .infinity)
                    .aspectRatio(1, contentMode: .fit)
                    .overlay {
                        ZStack(alignment: .bottomLeading) {
                            CachedAsyncImage(url: url)
                                .id(photo.id)
                                .frame(maxWidth: .infinity, maxHeight: .infinity)

                            if let caption = photo.caption, !caption.isEmpty {
                                LinearGradient(
                                    colors: [.black.opacity(0.6), .clear],
                                    startPoint: .bottom,
                                    endPoint: .center
                                )
                                Text(caption)
                                    .font(.caption)
                                    .foregroundStyle(.white)
                                    .padding(12)
                            }
                        }
                    }
                    .clipped()
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }

            if viewModel.photos.count > 1 {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(viewModel.photos) { photo in
                            if let url = URL(string: photo.url) {
                                Button {
                                    selectedPhotoId = photo.id
                                } label: {
                                    CachedAsyncImage(url: url)
                                        .frame(width: 72, height: 72)
                                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                                .stroke(
                                                    selectedPhoto?.id == photo.id
                                                        ? LeafbookColors.primary
                                                        : Color.clear,
                                                    lineWidth: 2
                                                )
                                        )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: - Header

    private var headerCard: some View {
        LeafbookCard {
            HStack(alignment: .top, spacing: 12) {
                ZStack {
                    Circle()
                        .fill(LeafbookColors.primary.opacity(0.12))
                        .frame(width: 44, height: 44)
                    Image(systemName: "leaf.fill")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(LeafbookColors.primary)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(plantType.name)
                        .font(.system(.title2, design: .serif).weight(.semibold))
                        .foregroundStyle(LeafbookColors.foreground)
                    if let scientific = plantType.scientificName {
                        Text(scientific)
                            .font(.subheadline)
                            .italic()
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.55))
                    }
                    Text("Plant type")
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(LeafbookColors.primary.opacity(0.8))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(LeafbookColors.primary.opacity(0.1))
                        .clipShape(Capsule())
                        .padding(.top, 2)
                }

                Spacer(minLength: 0)
            }
        }
    }

    // MARK: - Description

    private var descriptionCard: some View {
        LeafbookCard {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "info.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(LeafbookColors.purpleAccent)
                    Text("About")
                        .font(.headline)
                }
                if let description = plantType.description {
                    Text(description)
                        .font(.subheadline)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.85))
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    // MARK: - Care Stat Grid

    private var careStatGrid: some View {
        LeafbookCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 6) {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(LeafbookColors.roseAccent)
                    Text("Care guide")
                        .font(.headline)
                }

                LazyVGrid(columns: [
                    GridItem(.flexible(), spacing: 12),
                    GridItem(.flexible(), spacing: 12)
                ], spacing: 12) {
                    careStatCell(
                        icon: "drop.fill",
                        label: "Watering",
                        value: plantType.wateringFrequencyDays.map { "Every \($0) days" } ?? "Not set",
                        tagline: plantType.wateringFrequencyDays.map { wateringTagline($0) },
                        color: LeafbookColors.waterBlue
                    )
                    careStatCell(
                        icon: "sparkles",
                        label: "Fertilizing",
                        value: plantType.fertilizingFrequencyDays.map { "Every \($0) days" } ?? "Not set",
                        tagline: plantType.fertilizingFrequencyDays.map { fertilizingTagline($0) },
                        color: LeafbookColors.fertilizerAmber
                    )
                    careStatCell(
                        icon: "sun.max.fill",
                        label: "Light",
                        value: lightRangeLabel,
                        tagline: lightTagline,
                        color: Color(red: 0.92, green: 0.72, blue: 0.20)
                    )
                }
            }
        }
    }

    private func careStatCell(icon: String, label: String, value: String, tagline: String?, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(color)
                    .frame(width: 20, height: 20)
                Text(label)
                    .font(.caption)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
            }
            Text(value)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(LeafbookColors.foreground)
            if let tagline {
                Text(tagline)
                    .font(.caption2)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.5))
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(10)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private var lightRangeLabel: String {
        let minLabel = PlantLightLevel.from(plantType.lightMin)?.label
        let maxLabel = PlantLightLevel.from(plantType.lightMax)?.label
        switch (minLabel, maxLabel) {
        case let (min?, max?) where min == max: return min
        case let (min?, max?):                  return "\(min) – \(max)"
        case let (min?, nil):                   return "\(min)+"
        case let (nil, max?):                   return "Up to \(max)"
        case (nil, nil):                        return "Not set"
        }
    }

    private var lightTagline: String? {
        let minLevel = PlantLightLevel.from(plantType.lightMin)
        let maxLevel = PlantLightLevel.from(plantType.lightMax)
        if minLevel ?? .dark >= .brightIndirect { return "Bright light lover ☀️" }
        if maxLevel ?? .direct <= .lowIndirect  { return "Low light tolerant 🌑" }
        if minLevel ?? .dark >= .mediumIndirect { return "Medium to bright light" }
        return nil
    }

    private func wateringTagline(_ days: Int) -> String {
        if days <= 3 { return "Thirsty plant 💧" }
        if days <= 7 { return "Weekly routine 🌿" }
        if days <= 14 { return "Easygoing schedule" }
        return "Drought tolerant 🌵"
    }

    private func fertilizingTagline(_ days: Int) -> String {
        if days <= 14 { return "Hungry grower ✨" }
        if days <= 30 { return "Monthly feeding" }
        return "Low feeder 🌱"
    }

    // MARK: - Your Plants

    private var plantsSection: some View {
        LeafbookCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 6) {
                    Image(systemName: "leaf.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(LeafbookColors.primary)
                    Text("Your plants")
                        .font(.headline)
                    Spacer()
                    if !viewModel.plants.isEmpty {
                        Text("\(viewModel.plants.count)")
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(LeafbookColors.primary.opacity(0.9))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(LeafbookColors.primary.opacity(0.12))
                            .clipShape(Capsule())
                    }
                }

                if viewModel.isLoading && !viewModel.hasLoadedData {
                    HStack {
                        Spacer()
                        ProgressView("Loading…")
                        Spacer()
                    }
                    .padding(.vertical, 8)
                } else if viewModel.plants.isEmpty {
                    HStack(spacing: 10) {
                        Image(systemName: "tray")
                            .font(.system(size: 22))
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.3))
                        Text("You don't have any plants of this type yet.")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                    }
                    .padding(.vertical, 4)
                } else {
                    VStack(spacing: 0) {
                        ForEach(viewModel.plants) { plant in
                            Button {
                                linkedPlantId = plant.id
                            } label: {
                                plantRow(plant, thumbnailURL: viewModel.thumbnailURL(for: plant))
                            }
                            .buttonStyle(.plain)

                            if plant.id != viewModel.plants.last?.id {
                                Divider()
                                    .padding(.leading, 58)
                            }
                        }
                    }
                }

                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(Color.red)
                }
            }
        }
    }

    private func plantRow(_ plant: Plant, thumbnailURL: URL?) -> some View {
        HStack(spacing: 10) {
            // Thumbnail or fallback icon
            Group {
                if let url = thumbnailURL {
                    CachedAsyncImage(url: url)
                } else {
                    ZStack {
                        Rectangle()
                            .fill(plant.isLegacy == true
                                  ? LeafbookColors.muted.opacity(0.6)
                                  : LeafbookColors.primary.opacity(0.10))
                        Image(systemName: plant.isLegacy == true ? "archivebox.fill" : "leaf.fill")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(plant.isLegacy == true
                                             ? LeafbookColors.foreground.opacity(0.35)
                                             : LeafbookColors.primary.opacity(0.7))
                    }
                }
            }
            .frame(width: 48, height: 48)
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

            VStack(alignment: .leading, spacing: 2) {
                Text(plant.name)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(LeafbookColors.foreground)
                if let nickname = plant.nickname {
                    Text("\"\(nickname)\"")
                        .font(.caption)
                        .italic()
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.55))
                }
            }

            Spacer()

            HStack(spacing: 6) {
                if plant.isLegacy == true {
                    Text("Legacy")
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(LeafbookColors.muted.opacity(0.6))
                        .clipShape(Capsule())
                }
                Image(systemName: "chevron.right")
                    .font(.caption2)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.35))
            }
        }
        .padding(.vertical, 8)
        .contentShape(Rectangle())
    }
}

#Preview {
    NavigationStack {
        PlantTypeDetailView(plantType: .preview)
    }
    .environmentObject(SessionState(isPreview: true))
}
