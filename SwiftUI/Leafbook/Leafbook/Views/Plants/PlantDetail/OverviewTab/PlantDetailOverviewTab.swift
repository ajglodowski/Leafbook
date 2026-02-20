//
//  PlantDetailOverviewTab.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantDetailOverviewTab: View {
    let plant: Plant
    let isLegacy: Bool
    let dueTask: PlantDueTask?
    let journalEntries: [JournalEntry]
    let activeIssuesCount: Int
    let onEditPlant: (() -> Void)?
    let onAddIssue: (() -> Void)?
    let onAddJournal: (() -> Void)?
    var onMarkAsLegacy: (() -> Void)? = nil
    var onRestore: (() -> Void)? = nil

    private let quickActionHeight: CGFloat = 30

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if isLegacy {
                LeafbookCard {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 6) {
                            Image(systemName: "archivebox.fill")
                                .font(.system(size: 12))
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                            Text("Legacy Plant")
                                .font(.headline)
                        }
                        if let reason = plant.legacyReason, !reason.isEmpty {
                            detailRow(label: "Reason", value: reason)
                        }
                        if let legacyAt = plant.legacyAt, let date = formattedDate(legacyAt) {
                            detailRow(label: "Since", value: date)
                        }
                        if let onRestore {
                            Button {
                                onRestore()
                            } label: {
                                Label("Restore Plant", systemImage: "arrow.uturn.backward")
                                    .font(.caption.weight(.semibold))
                            }
                            .buttonStyle(.bordered)
                            .controlSize(.small)
                        }
                    }
                }
            }

            LeafbookCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Quick actions")
                        .font(.headline)
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            if let onEditPlant {
                                quickActionButton(
                                    title: "Edit plant",
                                    systemImage: "pencil",
                                    foreground: LeafbookColors.foreground,
                                    background: isLegacy ? LeafbookColors.muted.opacity(0.5) : LeafbookColors.muted,
                                    action: onEditPlant
                                )
                            }
                            if let onAddJournal {
                                quickActionButton(
                                    title: "Add journal",
                                    systemImage: isLegacy ? "book.closed" : "book.closed.fill",
                                    foreground: LeafbookColors.foreground,
                                    background: isLegacy ? LeafbookColors.primary.opacity(0.08) : LeafbookColors.primary.opacity(0.15),
                                    action: onAddJournal
                                )
                            }
                            if let onAddIssue {
                                quickActionButton(
                                    title: "Log issue",
                                    systemImage: isLegacy ? "exclamationmark.triangle" : "exclamationmark.triangle.fill",
                                    foreground: LeafbookColors.foreground,
                                    background: isLegacy ? LeafbookColors.roseAccent.opacity(0.1) : LeafbookColors.roseAccent.opacity(0.18),
                                    action: onAddIssue
                                )
                            }
                        }
                    }
                }
            }

            LeafbookCard {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Quick facts")
                        .font(.headline)

                    LazyVGrid(columns: [
                        GridItem(.flexible(), spacing: 12),
                        GridItem(.flexible(), spacing: 12)
                    ], spacing: 12) {
                        quickFactItem(
                            icon: "mappin.circle.fill",
                            label: "Location",
                            value: plant.location ?? "Not set",
                            color: LeafbookColors.roseAccent,
                            tagline: locationTagline(plant.location)
                        )
                        quickFactItem(
                            icon: lightIcon(plant.lightExposure),
                            label: "Light",
                            value: formattedLight(plant.lightExposure) ?? "Not set",
                            color: LeafbookColors.fertilizerAmber,
                            tagline: lightTagline(plant.lightExposure)
                        )
                        quickFactItem(
                            icon: sizeIcon(plant.sizeCategory),
                            label: "Size",
                            value: formattedSize(plant.sizeCategory) ?? "Not set",
                            color: LeafbookColors.primary,
                            tagline: sizeTagline(plant.sizeCategory)
                        )
                        quickFactItem(
                            icon: "calendar.circle.fill",
                            label: "Acquired",
                            value: formattedDate(plant.acquiredAt) ?? "Not set",
                            color: LeafbookColors.waterBlue,
                            tagline: acquiredTagline(plant.acquiredAt)
                        )
                        quickFactItem(
                            icon: howAcquiredIcon(plant.howAcquired),
                            label: "How",
                            value: plant.howAcquired ?? "Not set",
                            color: LeafbookColors.purpleAccent,
                            tagline: howTagline(plant.howAcquired)
                        )
                    }
                }
            }

            if !isLegacy {
                LeafbookCard {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Care status")
                            .font(.headline)
                        if let dueTask {
                            Text(dueTask.summary)
                                .font(.subheadline)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.8))
                        } else {
                            Text("No schedule yet — set one to get reminders.")
                                .font(.subheadline)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                        }
                        if activeIssuesCount > 0 {
                            Text("\(activeIssuesCount) active issue\(activeIssuesCount == 1 ? "" : "s")")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(LeafbookColors.foreground)
                        }
                    }
                }
            }

            LeafbookCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Recent journal notes")
                        .font(.headline)
                    if journalEntries.isEmpty {
                        Text("No notes yet for this plant.")
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                    } else {
                        ForEach(journalEntries) { entry in
                            DashboardJournalRow(entry: entry, thumbnailURL: nil)
                        }
                    }
                }
            }
            if !isLegacy, let onMarkAsLegacy {
                Button {
                    onMarkAsLegacy()
                } label: {
                    Label("Mark as Legacy", systemImage: "archivebox")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.5))
                }
                .buttonStyle(.plain)
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 8)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func detailRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
            Spacer()
            Text(value)
                .font(.subheadline)
        }
    }

    private func formattedDate(_ dateString: String?) -> String? {
        guard let dateString else { return nil }
        guard let resolvedDate = parseFlexibleDate(dateString) else { return nil }
        let display = DateFormatter()
        display.dateStyle = .medium
        display.timeStyle = .none
        return display.string(from: resolvedDate)
    }

    private func formattedLight(_ light: LightRequirement?) -> String? {
        return light?.displayName
    }

    private func formattedSize(_ size: SizeCategory?) -> String? {
        return size?.displayName
    }

    private func quickActionButton(
        title: String,
        systemImage: String,
        foreground: Color,
        background: Color,
        action: @escaping () -> Void
    ) -> some View {
        Button {
            action()
        } label: {
            Label(title, systemImage: systemImage)
                .font(.caption.weight(.semibold))
                .foregroundStyle(foreground)
                .padding(.horizontal, 12)
                .frame(height: quickActionHeight)
        }
        .buttonStyle(.plain)
        .background(background)
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private func quickFactItem(icon: String, label: String, value: String, color: Color, tagline: String? = nil) -> some View {
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

    private func lightIcon(_ light: LightRequirement?) -> String {
        return light?.symbolName ?? "sun.max.fill"
    }

    private func sizeIcon(_ size: SizeCategory?) -> String {
        return size?.symbolName ?? "ruler.fill"
    }

    private func howAcquiredIcon(_ how: String?) -> String {
        guard let how = how?.lowercased() else { return "bag.fill" }
        if how.contains("gift") || how.contains("given") {
            return "gift.fill"
        } else if how.contains("propagat") || how.contains("cutting") {
            return "scissors"
        } else if how.contains("store") || how.contains("shop") || how.contains("purchase") || how.contains("bought") {
            return "bag.fill"
        } else if how.contains("trade") || how.contains("swap") {
            return "arrow.left.arrow.right"
        } else {
            return "bag.fill"
        }
    }

    private func lightTagline(_ light: LightRequirement?) -> String? {
        return light?.tagline
    }

    private func locationTagline(_ location: String?) -> String? {
        guard let location, !location.isEmpty else { return nil }
        return "Current home 🏡"
    }

    private func sizeTagline(_ size: SizeCategory?) -> String? {
        return size?.tagline
    }

    private func acquiredTagline(_ acquiredAt: String?) -> String? {
        guard let acquiredAt else { return nil }
        guard let resolvedDate = parseFlexibleDate(acquiredAt) else { return nil }

        let calendar = Calendar.current
        let components = calendar.dateComponents([.day, .month, .year], from: resolvedDate, to: Date())

        if let years = components.year, years > 0 {
            return years == 1 ? "1 year together 💚" : "\(years) years together 💚"
        } else if let months = components.month, months > 0 {
            return months == 1 ? "1 month together 🌱" : "\(months) months together 🌱"
        } else if let days = components.day, days > 0 {
            return days == 1 ? "1 day together ✨" : "\(days) days together ✨"
        }
        return "Just joined! ✨"
    }

    private func parseFlexibleDate(_ dateString: String) -> Date? {
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = iso.date(from: dateString) { return date }
        iso.formatOptions = [.withInternetDateTime]
        if let date = iso.date(from: dateString) { return date }
        let plain = DateFormatter()
        plain.dateFormat = "yyyy-MM-dd"
        plain.locale = Locale(identifier: "en_US_POSIX")
        return plain.date(from: dateString)
    }

    private func howTagline(_ how: String?) -> String? {
        guard let how = how?.lowercased(), !how.isEmpty else { return nil }
        if how.contains("gift") || how.contains("given") {
            return "A thoughtful gift 🎁"
        } else if how.contains("propagat") || how.contains("cutting") {
            return "Homegrown clone ✂️"
        } else if how.contains("store") || how.contains("shop") || how.contains("purchase") || how.contains("bought") {
            return "Retail therapy 🛍️"
        } else if how.contains("trade") || how.contains("swap") {
            return "Plant swap success 🔄"
        } else {
            return "Origin story 📖"
        }
    }
}

#Preview {
    PlantDetailOverviewTab(
        plant: .preview,
        isLegacy: false,
        dueTask: .preview,
        journalEntries: [.preview],
        activeIssuesCount: 1,
        onEditPlant: nil,
        onAddIssue: nil,
        onAddJournal: nil
    )
    .padding()
    .background(LeafbookColors.background)
}
