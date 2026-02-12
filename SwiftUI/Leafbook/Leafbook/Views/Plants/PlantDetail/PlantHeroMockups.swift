//
//  PlantHeroMockups.swift
//  Leafbook
//
//  Three distinct hero view concepts for plant detail.
//  All assume square (1:1) plant photos.
//

import SwiftUI

// MARK: - Shared helper

private func lightDisplayLabel(for raw: String?) -> String? {
    guard let light = raw else { return nil }
    let labels: [String: String] = [
        "dark": "Dark",
        "low_indirect": "Low Indirect",
        "medium_indirect": "Medium Indirect",
        "bright_indirect": "Bright Indirect",
        "direct": "Direct"
    ]
    return labels[light] ?? light.replacingOccurrences(of: "_", with: " ").capitalized
}

// ────────────────────────────────────────────────────────────────────────────
// MARK: - Mockup A: "Airy Stack"
//
// No card wrapper — floats directly on the page background.
// Square photo centered at a comfortable size. Generous whitespace.
// Info is plain text with clear hierarchy — no pills, no decoration.
// Optimized for quick scanning on a phone.
// ────────────────────────────────────────────────────────────────────────────

struct PlantHeroMockupA: View {
    let plant: Plant
    let photo: PlantPhoto?
    var dueTask: PlantDueTask?
    var photoCount: Int = 1

    var body: some View {
        VStack(spacing: 20) {

            // Square photo
            squarePhoto(
                photo: photo,
                size: 200,
                cornerRadius: 16,
                photoCount: photoCount
            )

            // Name block
            VStack(spacing: 4) {
                Text(plant.name)
                    .font(.system(.title, design: .serif))
                    .fontWeight(.bold)
                    .foregroundStyle(LeafbookColors.foreground)
                    .multilineTextAlignment(.center)

                if let nickname = plant.nickname, !nickname.isEmpty {
                    Text("\u{201C}\(nickname)\u{201D}")
                        .font(.system(.body, design: .serif))
                        .italic()
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.55))
                }
            }

            // Type line
            if let plantType = plant.plantTypes {
                HStack(spacing: 6) {
                    Image(systemName: "leaf")
                        .font(.system(size: 12))
                        .foregroundStyle(LeafbookColors.primary)
                    Text(plantType.name)
                        .font(.subheadline)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    if let sci = plantType.scientificName, !sci.isEmpty {
                        Text("·")
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.3))
                        Text(sci)
                            .font(.subheadline)
                            .italic()
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.5))
                    }
                }
            }

            // Simple detail line — plain text, dot-separated
            detailTextRow

            // Care status
            if let dueTask {
                HStack(spacing: 0) {
                    airyCareCell(
                        icon: "drop.fill",
                        label: "Water",
                        status: dueTask.wateringStatus,
                        color: LeafbookColors.waterBlue
                    )

                    Rectangle()
                        .fill(LeafbookColors.muted)
                        .frame(width: 1)
                        .padding(.vertical, 10)

                    airyCareCell(
                        icon: "sparkles",
                        label: "Feed",
                        status: dueTask.fertilizingStatus,
                        color: LeafbookColors.fertilizerAmber
                    )
                }
                .frame(height: 52)
                .background(LeafbookColors.card)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }

            // Origin
            if let howAcquired = plant.howAcquired {
                HStack(spacing: 5) {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 10))
                        .foregroundStyle(LeafbookColors.roseAccent.opacity(0.6))
                    Text(howAcquired)
                        .font(.caption)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.45))
                }
            }
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - A helpers

    private var detailTextRow: some View {
        HStack(spacing: 0) {
            let items = detailItems
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                if index > 0 {
                    Text("  ·  ")
                        .font(.caption)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.25))
                }
                HStack(spacing: 4) {
                    Image(systemName: item.icon)
                        .font(.system(size: 10))
                        .foregroundStyle(item.color.opacity(0.7))
                    Text(item.text)
                        .font(.caption)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                }
            }
        }
    }

    private var detailItems: [(icon: String, text: String, color: Color)] {
        var items: [(icon: String, text: String, color: Color)] = []
        items.append((
            icon: plant.plantLocation == "indoor" ? "house.fill" : "tree.fill",
            text: plant.plantLocation == "indoor" ? "Indoor" : "Outdoor",
            color: LeafbookColors.primary
        ))
        if let location = plant.location, !location.isEmpty {
            items.append((icon: "mappin", text: location, color: LeafbookColors.roseAccent))
        }
        if let label = lightDisplayLabel(for: plant.lightExposure) {
            items.append((icon: "sun.max.fill", text: label, color: LeafbookColors.fertilizerAmber))
        }
        return items
    }

    private func airyCareCell(icon: String, label: String, status: TaskStatus?, color: Color) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 15))
                .foregroundStyle(color)
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                Text(status?.displayText ?? "Not tracked")
                    .font(.caption)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.5))
            }
        }
        .frame(maxWidth: .infinity)
    }
}

// ────────────────────────────────────────────────────────────────────────────
// MARK: - Mockup B: "Compact Shelf"
//
// Horizontal layout. Square photo on the leading edge, all info stacked on
// the trailing side. The 1:1 photo creates natural proportions and keeps
// the card compact. Text-forward — info is the star, photo is context.
// ────────────────────────────────────────────────────────────────────────────

struct PlantHeroMockupB: View {
    let plant: Plant
    let photo: PlantPhoto?
    var dueTask: PlantDueTask?
    var photoCount: Int = 1

    var body: some View {
        HStack(alignment: .top, spacing: 16) {

            // Square photo — leading edge
            squarePhoto(
                photo: photo,
                size: 130,
                cornerRadius: 14,
                photoCount: photoCount
            )

            // Info — trailing side
            VStack(alignment: .leading, spacing: 8) {
                // Name
                VStack(alignment: .leading, spacing: 2) {
                    Text(plant.name)
                        .font(.system(.title3, design: .serif))
                        .fontWeight(.bold)
                        .foregroundStyle(LeafbookColors.foreground)
                        .lineLimit(2)

                    if let nickname = plant.nickname, !nickname.isEmpty {
                        Text("\u{201C}\(nickname)\u{201D}")
                            .font(.callout)
                            .italic()
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.55))
                    }
                }

                // Type
                if let plantType = plant.plantTypes {
                    Text(plantType.name)
                        .font(.caption)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.55))
                }

                // Thin divider
                Rectangle()
                    .fill(LeafbookColors.muted)
                    .frame(height: 1)
                    .padding(.vertical, 2)

                // Detail rows
                VStack(alignment: .leading, spacing: 6) {
                    shelfDetailRow(
                        icon: plant.plantLocation == "indoor" ? "house.fill" : "tree.fill",
                        text: (plant.plantLocation == "indoor" ? "Indoor" : "Outdoor")
                            + (plant.location.map { ", \($0)" } ?? ""),
                        color: LeafbookColors.primary
                    )

                    if let label = lightDisplayLabel(for: plant.lightExposure) {
                        shelfDetailRow(icon: "sun.max.fill", text: label, color: LeafbookColors.fertilizerAmber)
                    }
                }

                // Care status
                if let dueTask {
                    HStack(spacing: 14) {
                        shelfCareIndicator(
                            icon: "drop.fill",
                            status: dueTask.wateringStatus,
                            color: LeafbookColors.waterBlue
                        )
                        shelfCareIndicator(
                            icon: "sparkles",
                            status: dueTask.fertilizingStatus,
                            color: LeafbookColors.fertilizerAmber
                        )
                    }
                    .padding(.top, 2)
                }
            }
        }
        .padding(16)
        .background(LeafbookColors.card)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    // MARK: - B helpers

    private func shelfDetailRow(icon: String, text: String, color: Color) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 11))
                .foregroundStyle(color.opacity(0.7))
                .frame(width: 14, alignment: .center)
            Text(text)
                .font(.caption)
                .foregroundStyle(LeafbookColors.foreground.opacity(0.65))
        }
    }

    private func shelfCareIndicator(icon: String, status: TaskStatus?, color: Color) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 11))
                .foregroundStyle(color)
            Text(status?.displayText ?? "—")
                .font(.caption2.weight(.medium))
                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(color.opacity(0.08))
        .clipShape(Capsule())
    }
}

// ────────────────────────────────────────────────────────────────────────────
// MARK: - Mockup C: "Pinned Journal"
//
// Creative image placement. The square photo is slightly rotated and
// offset into the top-leading corner — like a Polaroid pinned to a
// journal page. Plant name sits next to the photo. Clean info section
// flows below. Scrapbook / journal personality.
// ────────────────────────────────────────────────────────────────────────────

struct PlantHeroMockupC: View {
    let plant: Plant
    let photo: PlantPhoto?
    var dueTask: PlantDueTask?
    var photoCount: Int = 1

    private let photoSize: CGFloat = 140

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {

            // Top band — muted tint behind the photo row
            ZStack(alignment: .topLeading) {

                // Tinted header band
                Rectangle()
                    .fill(LeafbookColors.primary.opacity(0.06))
                    .frame(height: photoSize * 0.45)

                // Photo + name row
                HStack(alignment: .top, spacing: 16) {
                    // Pinned photo
                    pinnedPhoto
                        .padding(.top, 12)
                        .padding(.leading, 16)

                    // Name block — aligned to photo top
                    VStack(alignment: .leading, spacing: 4) {
                        Text(plant.name)
                            .font(.system(.title3, design: .serif))
                            .fontWeight(.bold)
                            .foregroundStyle(LeafbookColors.foreground)
                            .lineLimit(2)

                        if let nickname = plant.nickname, !nickname.isEmpty {
                            Text("\u{201C}\(nickname)\u{201D}")
                                .font(.callout)
                                .italic()
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.55))
                        }

                        if let plantType = plant.plantTypes {
                            Text(plantType.name)
                                .font(.caption)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.5))
                                .padding(.top, 2)

                            if let sci = plantType.scientificName, !sci.isEmpty {
                                Text(sci)
                                    .font(.caption2)
                                    .italic()
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.35))
                            }
                        }

                        // Origin inline with name area
                        if let howAcquired = plant.howAcquired {
                            HStack(spacing: 4) {
                                Image(systemName: "heart.fill")
                                    .font(.system(size: 9))
                                    .foregroundStyle(LeafbookColors.roseAccent.opacity(0.6))
                                Text(howAcquired)
                                    .font(.caption2)
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.4))
                            }
                            .padding(.top, 4)
                        }
                    }
                    .padding(.top, 20)
                    .padding(.trailing, 16)

                    Spacer(minLength: 0)
                }
            }
            .frame(minHeight: photoSize + 24) // ensure the band area fits the photo

            // Info section below
            VStack(alignment: .leading, spacing: 14) {

                // Detail row — icon pairs
                HStack(spacing: 16) {
                    journalDetail(
                        icon: plant.plantLocation == "indoor" ? "house.fill" : "tree.fill",
                        label: plant.plantLocation == "indoor" ? "Indoor" : "Outdoor",
                        color: LeafbookColors.primary
                    )

                    if let location = plant.location, !location.isEmpty {
                        journalDetail(icon: "mappin", label: location, color: LeafbookColors.roseAccent)
                    }

                    if let label = lightDisplayLabel(for: plant.lightExposure) {
                        journalDetail(icon: "sun.max.fill", label: label, color: LeafbookColors.fertilizerAmber)
                    }
                }

                // Care status
                if let dueTask {
                    HStack(spacing: 0) {
                        journalCareCell(
                            icon: "drop.fill",
                            label: "Water",
                            status: dueTask.wateringStatus,
                            color: LeafbookColors.waterBlue
                        )

                        Rectangle()
                            .fill(LeafbookColors.muted)
                            .frame(width: 1)
                            .padding(.vertical, 8)

                        journalCareCell(
                            icon: "sparkles",
                            label: "Feed",
                            status: dueTask.fertilizingStatus,
                            color: LeafbookColors.fertilizerAmber
                        )
                    }
                    .frame(height: 50)
                    .background(LeafbookColors.muted.opacity(0.3))
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
            .padding(.bottom, 18)
        }
        .background(LeafbookColors.card)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .shadow(color: LeafbookColors.foreground.opacity(0.06), radius: 12, x: 0, y: 4)
    }

    // MARK: - C helpers

    private var pinnedPhoto: some View {
        ZStack(alignment: .bottomTrailing) {
            // White "polaroid" border
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(LeafbookColors.card)
                .frame(width: photoSize + 10, height: photoSize + 10)
                .shadow(color: LeafbookColors.foreground.opacity(0.12), radius: 8, x: 2, y: 4)

            // Actual photo
            Group {
                if let urlString = photo?.url,
                   let url = URL(string: urlString),
                   !urlString.isEmpty {
                    CachedAsyncImage(url: url)
                } else {
                    Rectangle()
                        .fill(LeafbookColors.muted.opacity(0.35))
                        .overlay {
                            Image(systemName: "leaf.fill")
                                .font(.system(size: 28))
                                .foregroundStyle(LeafbookColors.primary.opacity(0.25))
                        }
                }
            }
            .frame(width: photoSize, height: photoSize)
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .offset(x: -5, y: -5)

            // Photo count
            if photoCount > 1 {
                HStack(spacing: 3) {
                    Image(systemName: "photo.on.rectangle")
                        .font(.system(size: 8))
                    Text("\(photoCount)")
                        .font(.system(size: 9, weight: .semibold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 7)
                .padding(.vertical, 3)
                .background(.black.opacity(0.55))
                .clipShape(Capsule())
                .offset(x: -10, y: -10)
            }
        }
        .rotationEffect(.degrees(-2), anchor: .center)
    }

    private func journalDetail(icon: String, label: String, color: Color) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 11))
                .foregroundStyle(color.opacity(0.7))
            Text(label)
                .font(.caption)
                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
        }
    }

    private func journalCareCell(icon: String, label: String, status: TaskStatus?, color: Color) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 13))
                .foregroundStyle(color)
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                Text(status?.displayText ?? "Not tracked")
                    .font(.caption2)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.5))
            }
        }
        .frame(maxWidth: .infinity)
    }
}

// ────────────────────────────────────────────────────────────────────────────
// MARK: - Mockup D: "Bold Shelf"
//
// Horizontal layout with a big photo, large name, capsule badge labels,
// and a unified card that flows cleanly into a care row and actions bar.
// Everything lives inside one rounded card with consistent backgrounds.
// ────────────────────────────────────────────────────────────────────────────

struct PlantHeroMockupD: View {
    let plant: Plant
    let photo: PlantPhoto?
    var dueTask: PlantDueTask?
    var photoCount: Int = 1
    var onWater: ((Date) -> Void)?
    var onFertilize: ((Date) -> Void)?
    var onMove: (() -> Void)?
    var onEdit: (() -> Void)?

    private let actionHeight: CGFloat = 34

    var body: some View {
        VStack(spacing: 0) {

            // ── Photo + identity ──
            HStack(alignment: .top, spacing: 14) {
                squarePhoto(photo: photo, size: 160, cornerRadius: 14, photoCount: photoCount)

                VStack(alignment: .leading, spacing: 6) {
                    Text(plant.name)
                        .font(.system(.title, design: .serif))
                        .fontWeight(.bold)
                        .foregroundStyle(LeafbookColors.foreground)
                        .lineLimit(2)

                    if let nickname = plant.nickname, !nickname.isEmpty {
                        Text("\u{201C}\(nickname)\u{201D}")
                            .font(.callout)
                            .italic()
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.55))
                    }

                    if let plantType = plant.plantTypes {
                        HStack(spacing: 4) {
                            Image(systemName: "leaf")
                                .font(.system(size: 11))
                                .foregroundStyle(LeafbookColors.primary)
                            Text(plantType.name)
                                .font(.subheadline)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.65))
                            if let sci = plantType.scientificName, !sci.isEmpty {
                                Text("·")
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.25))
                                Text(sci)
                                    .font(.caption)
                                    .italic()
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.4))
                            }
                        }
                    }

                    // Badges
                    FlowLayout(spacing: 6) {
                        PlantBadge(
                            icon: plant.plantLocation == "indoor" ? "house.fill" : "tree.fill",
                            text: plant.plantLocation == "indoor" ? "Indoor" : "Outdoor",
                            iconColor: LeafbookColors.primary
                        )
                        if let location = plant.location, !location.isEmpty {
                            PlantBadge(icon: "mappin", text: location, iconColor: LeafbookColors.roseAccent)
                        }
                        if let label = lightDisplayLabel(for: plant.lightExposure) {
                            PlantBadge(icon: "sun.max.fill", text: label, iconColor: LeafbookColors.fertilizerAmber)
                        }
                    }

                    if let howAcquired = plant.howAcquired {
                        HStack(spacing: 4) {
                            Image(systemName: "heart.fill")
                                .font(.system(size: 9))
                                .foregroundStyle(LeafbookColors.roseAccent.opacity(0.7))
                            Text(howAcquired)
                                .font(.caption2)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.45))
                        }
                    }
                }
            }
            .padding(16)

            // ── Care + actions combined strip ──
            VStack(spacing: 0) {
                // Care status
                if let dueTask {
                    HStack(spacing: 0) {
                        dCareCell(icon: "drop.fill", label: "Water", status: dueTask.wateringStatus, color: LeafbookColors.waterBlue)
                        Rectangle().fill(LeafbookColors.foreground.opacity(0.08)).frame(width: 1).padding(.vertical, 10)
                        dCareCell(icon: "sparkles", label: "Feed", status: dueTask.fertilizingStatus, color: LeafbookColors.fertilizerAmber)
                    }
                    .frame(height: 48)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 12)
                }

                // Actions — uniform height
                HStack(spacing: 8) {
                    if let onEdit {
                        Button(action: onEdit) {
                            Label("Edit", systemImage: "pencil")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.85))
                                .frame(maxWidth: .infinity, minHeight: actionHeight)
                        }
                        .buttonStyle(.plain)
                        .background(LeafbookColors.card)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                    if let onWater {
                        CareLogButton(title: "Water", systemImage: "drop.fill", tint: LeafbookColors.waterBlue, onLog: onWater)
                    }
                    if let onFertilize {
                        CareLogButton(title: "Feed", systemImage: "sparkles", tint: LeafbookColors.fertilizerAmber, onLog: onFertilize)
                    }
                    if let onMove {
                        Button(action: onMove) {
                            Label("Move", systemImage: "location.fill")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity, minHeight: actionHeight)
                        }
                        .buttonStyle(.plain)
                        .background(LeafbookColors.primary)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 14)
            }
            .padding(.top, 12)
            .background(LeafbookColors.muted.opacity(0.3))
        }
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(LeafbookColors.card)
        )
    }

    // MARK: - D helpers

    private func dCareCell(icon: String, label: String, status: TaskStatus?, color: Color) -> some View {
        HStack(spacing: 7) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(color)
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.65))
                Text(status?.displayText ?? "Not tracked")
                    .font(.caption2)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.45))
            }
        }
        .frame(maxWidth: .infinity)
    }
}

// ────────────────────────────────────────────────────────────────────────────
// MARK: - Mockup E: "Hero Card"
//
// Centered vertical profile-card layout. Large photo on top, big name
// centered below, badges, care status, then a clean full-width action
// bar at the bottom. Entire card is one cohesive surface.
// ────────────────────────────────────────────────────────────────────────────

struct PlantHeroMockupE: View {
    let plant: Plant
    let photo: PlantPhoto?
    var dueTask: PlantDueTask?
    var photoCount: Int = 1
    var onWater: ((Date) -> Void)?
    var onFertilize: ((Date) -> Void)?
    var onMove: (() -> Void)?
    var onEdit: (() -> Void)?

    var body: some View {
        VStack(spacing: 0) {

            // ── Photo ──
            squarePhoto(photo: photo, size: 200, cornerRadius: 16, photoCount: photoCount)
                .padding(.top, 20)
                .padding(.bottom, 14)

            // ── Info ──
            VStack(spacing: 8) {
                Text(plant.name)
                    .font(.system(.title, design: .serif))
                    .fontWeight(.bold)
                    .foregroundStyle(LeafbookColors.foreground)
                    .multilineTextAlignment(.center)

                if let nickname = plant.nickname, !nickname.isEmpty {
                    Text("\u{201C}\(nickname)\u{201D}")
                        .font(.callout)
                        .italic()
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.55))
                }

                if let plantType = plant.plantTypes {
                    HStack(spacing: 4) {
                        Image(systemName: "leaf")
                            .font(.system(size: 11))
                            .foregroundStyle(LeafbookColors.primary)
                        Text(plantType.name)
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.65))
                        if let sci = plantType.scientificName, !sci.isEmpty {
                            Text("·")
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.25))
                            Text(sci)
                                .font(.caption)
                                .italic()
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.4))
                        }
                    }
                }

                // Badges
                HStack(spacing: 6) {
                    PlantBadge(
                        icon: plant.plantLocation == "indoor" ? "house.fill" : "tree.fill",
                        text: plant.plantLocation == "indoor" ? "Indoor" : "Outdoor",
                        iconColor: LeafbookColors.primary
                    )
                    if let location = plant.location, !location.isEmpty {
                        PlantBadge(icon: "mappin", text: location, iconColor: LeafbookColors.roseAccent)
                    }
                    if let label = lightDisplayLabel(for: plant.lightExposure) {
                        PlantBadge(icon: "sun.max.fill", text: label, iconColor: LeafbookColors.fertilizerAmber)
                    }
                }

                if let howAcquired = plant.howAcquired {
                    HStack(spacing: 4) {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 9))
                            .foregroundStyle(LeafbookColors.roseAccent.opacity(0.6))
                        Text(howAcquired)
                            .font(.caption)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.45))
                    }
                }

                // Care status
                if let dueTask {
                    HStack(spacing: 16) {
                        HStack(spacing: 5) {
                            Image(systemName: "drop.fill")
                                .font(.system(size: 12))
                                .foregroundStyle(LeafbookColors.waterBlue)
                            Text(dueTask.wateringStatus?.displayText ?? "Not tracked")
                                .font(.caption)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                        }
                        HStack(spacing: 5) {
                            Image(systemName: "sparkles")
                                .font(.system(size: 12))
                                .foregroundStyle(LeafbookColors.fertilizerAmber)
                            Text(dueTask.fertilizingStatus?.displayText ?? "Not tracked")
                                .font(.caption)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                        }
                    }
                    .padding(.top, 4)
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)

            // ── Actions bar ──
            HStack(spacing: 8) {
                if let onEdit {
                    Button(action: onEdit) {
                        Label("Edit", systemImage: "pencil")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.85))
                            .frame(maxWidth: .infinity, minHeight: 30)
                    }
                    .buttonStyle(.plain)
                    .background(LeafbookColors.card)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                if let onWater {
                    CareLogButton(title: "Water", systemImage: "drop.fill", tint: LeafbookColors.waterBlue, onLog: onWater)
                }
                if let onFertilize {
                    CareLogButton(title: "Feed", systemImage: "sparkles", tint: LeafbookColors.fertilizerAmber, onLog: onFertilize)
                }
                if let onMove {
                    Button(action: onMove) {
                        Label("Move", systemImage: "location.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity, minHeight: 30)
                    }
                    .buttonStyle(.plain)
                    .background(LeafbookColors.primary)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(LeafbookColors.muted.opacity(0.3))
        }
        .background(LeafbookColors.card)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

// ────────────────────────────────────────────────────────────────────────────
// MARK: - Mockup F: "Side-by-Side with Action Drawer"
//
// Horizontal layout with big photo, big name, vertical icon-label rows,
// care strip, and a drawer-style actions section. The whole card uses
// one consistent background — sections are separated by subtle dividers
// instead of jarring color changes.
// ────────────────────────────────────────────────────────────────────────────

struct PlantHeroMockupF: View {
    let plant: Plant
    let photo: PlantPhoto?
    var dueTask: PlantDueTask?
    var photoCount: Int = 1
    var onWater: ((Date) -> Void)?
    var onFertilize: ((Date) -> Void)?
    var onMove: (() -> Void)?
    var onEdit: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {

            // ── Photo + identity ──
            HStack(alignment: .top, spacing: 14) {
                squarePhoto(photo: photo, size: 170, cornerRadius: 14, photoCount: photoCount)

                VStack(alignment: .leading, spacing: 6) {
                    Text(plant.name)
                        .font(.system(.title, design: .serif))
                        .fontWeight(.bold)
                        .foregroundStyle(LeafbookColors.foreground)
                        .lineLimit(2)

                    if let nickname = plant.nickname, !nickname.isEmpty {
                        Text("\u{201C}\(nickname)\u{201D}")
                            .font(.callout)
                            .italic()
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.55))
                    }

                    if let plantType = plant.plantTypes {
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 4) {
                                Image(systemName: "leaf")
                                    .font(.system(size: 11))
                                    .foregroundStyle(LeafbookColors.primary)
                                Text(plantType.name)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                            }
                            if let sci = plantType.scientificName, !sci.isEmpty {
                                Text(sci)
                                    .font(.caption)
                                    .italic()
                                    .foregroundStyle(LeafbookColors.foreground.opacity(0.4))
                                    .padding(.leading, 15)
                            }
                        }
                    }

                    // Detail rows with icons
                    VStack(alignment: .leading, spacing: 4) {
                        fRow(
                            icon: plant.plantLocation == "indoor" ? "house.fill" : "tree.fill",
                            text: plant.plantLocation == "indoor" ? "Indoor" : "Outdoor",
                            color: LeafbookColors.primary
                        )
                        if let location = plant.location, !location.isEmpty {
                            fRow(icon: "mappin", text: location, color: LeafbookColors.roseAccent)
                        }
                        if let label = lightDisplayLabel(for: plant.lightExposure) {
                            fRow(icon: "sun.max.fill", text: label, color: LeafbookColors.fertilizerAmber)
                        }
                    }

                    if let howAcquired = plant.howAcquired {
                        HStack(spacing: 4) {
                            Image(systemName: "heart.fill")
                                .font(.system(size: 9))
                                .foregroundStyle(LeafbookColors.roseAccent.opacity(0.7))
                            Text(howAcquired)
                                .font(.caption2)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.4))
                        }
                        .padding(.top, 2)
                    }
                }
            }
            .padding(16)

            // ── Divider ──
            Rectangle()
                .fill(LeafbookColors.foreground.opacity(0.06))
                .frame(height: 1)
                .padding(.horizontal, 16)

            // ── Care status ──
            if let dueTask {
                HStack(spacing: 0) {
                    fCareCell(icon: "drop.fill", label: "Water", status: dueTask.wateringStatus, color: LeafbookColors.waterBlue)
                    Circle().fill(LeafbookColors.foreground.opacity(0.1)).frame(width: 3, height: 3)
                    fCareCell(icon: "sparkles", label: "Feed", status: dueTask.fertilizingStatus, color: LeafbookColors.fertilizerAmber)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }

            // ── Divider ──
            Rectangle()
                .fill(LeafbookColors.foreground.opacity(0.06))
                .frame(height: 1)
                .padding(.horizontal, 16)

            // ── Actions ──
            HStack(spacing: 8) {
                if let onEdit {
                    Button(action: onEdit) {
                        Label("Edit", systemImage: "pencil")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.85))
                            .frame(maxWidth: .infinity, minHeight: 30)
                    }
                    .buttonStyle(.plain)
                    .background(LeafbookColors.muted.opacity(0.5))
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                if let onWater {
                    CareLogButton(title: "Water", systemImage: "drop.fill", tint: LeafbookColors.waterBlue, onLog: onWater)
                }
                if let onFertilize {
                    CareLogButton(title: "Feed", systemImage: "sparkles", tint: LeafbookColors.fertilizerAmber, onLog: onFertilize)
                }
                if let onMove {
                    Button(action: onMove) {
                        Label("Move", systemImage: "location.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity, minHeight: 30)
                    }
                    .buttonStyle(.plain)
                    .background(LeafbookColors.primary)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            }
            .padding(14)
        }
        .background(LeafbookColors.card)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    // MARK: - F helpers

    private func fRow(icon: String, text: String, color: Color) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 10))
                .foregroundStyle(color)
                .frame(width: 14, alignment: .center)
            Text(text)
                .font(.caption)
                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
        }
    }

    private func fCareCell(icon: String, label: String, status: TaskStatus?, color: Color) -> some View {
        HStack(spacing: 7) {
            Image(systemName: icon)
                .font(.system(size: 13))
                .foregroundStyle(color)
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.65))
                Text(status?.displayText ?? "Not tracked")
                    .font(.caption2)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.45))
            }
        }
        .frame(maxWidth: .infinity)
    }
}

// ────────────────────────────────────────────────────────────────────────────
// MARK: - Shared square photo component
// ────────────────────────────────────────────────────────────────────────────

struct squarePhoto: View {
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

// ────────────────────────────────────────────────────────────────────────────
// MARK: - Combined Preview
// ────────────────────────────────────────────────────────────────────────────

private struct MockupSectionHeader: View {
    let letter: String
    let title: String

    var body: some View {
        HStack(spacing: 8) {
            Text(letter)
                .font(.system(size: 13, weight: .bold, design: .monospaced))
                .foregroundStyle(.white)
                .frame(width: 24, height: 24)
                .background(LeafbookColors.primary)
                .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
            Spacer()
        }
    }
}

#Preview("Plant Hero Mockups") {
    ScrollView {
        VStack(spacing: 32) {
            Text("Hero View Concepts")
                .font(.system(.title3, design: .serif))
                .fontWeight(.bold)
                .foregroundStyle(LeafbookColors.foreground)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Mockup A
            VStack(alignment: .leading, spacing: 10) {
                MockupSectionHeader(letter: "A", title: "Airy Stack")
                PlantHeroMockupA(
                    plant: .preview,
                    photo: .preview,
                    dueTask: .preview,
                    photoCount: 5
                )
            }

            Divider()

            // Mockup B
            VStack(alignment: .leading, spacing: 10) {
                MockupSectionHeader(letter: "B", title: "Compact Shelf")
                PlantHeroMockupB(
                    plant: .preview,
                    photo: .preview,
                    dueTask: .preview,
                    photoCount: 5
                )
            }

            Divider()

            // Mockup C
            VStack(alignment: .leading, spacing: 10) {
                MockupSectionHeader(letter: "C", title: "Pinned Journal")
                PlantHeroMockupC(
                    plant: .preview,
                    photo: .preview,
                    dueTask: .preview,
                    photoCount: 5
                )
            }

            Divider()

            // Mockup D
            VStack(alignment: .leading, spacing: 10) {
                MockupSectionHeader(letter: "D", title: "Bold Shelf")
                PlantHeroMockupD(
                    plant: .preview,
                    photo: .preview,
                    dueTask: .preview,
                    photoCount: 5,
                    onWater: { _ in },
                    onFertilize: { _ in },
                    onMove: {},
                    onEdit: {}
                )
            }

            Divider()

            // Mockup E
            VStack(alignment: .leading, spacing: 10) {
                MockupSectionHeader(letter: "E", title: "Hero Card")
                PlantHeroMockupE(
                    plant: .preview,
                    photo: .preview,
                    dueTask: .preview,
                    photoCount: 5,
                    onWater: { _ in },
                    onFertilize: { _ in },
                    onMove: {},
                    onEdit: {}
                )
            }

            Divider()

            // Mockup F
            VStack(alignment: .leading, spacing: 10) {
                MockupSectionHeader(letter: "F", title: "Side-by-Side with Action Drawer")
                PlantHeroMockupF(
                    plant: .preview,
                    photo: .preview,
                    dueTask: .preview,
                    photoCount: 5,
                    onWater: { _ in },
                    onFertilize: { _ in },
                    onMove: {},
                    onEdit: {}
                )
            }
        }
        .padding()
    }
    .background(LeafbookColors.background)
}
