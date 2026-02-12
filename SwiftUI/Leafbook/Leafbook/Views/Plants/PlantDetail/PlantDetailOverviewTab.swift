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
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        let date = formatter.date(from: dateString) ?? ISO8601DateFormatter().date(from: dateString)
        guard let resolvedDate = date else { return nil }
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: resolvedDate)
    }

    private func formattedLight(_ light: String?) -> String? {
        guard let light, !light.isEmpty else { return nil }
        let labels: [String: String] = [
            "dark": "Dark",
            "low_indirect": "Low indirect",
            "medium_indirect": "Medium indirect",
            "bright_indirect": "Bright indirect",
            "direct": "Direct"
        ]
        return labels[light] ?? light.replacingOccurrences(of: "_", with: " ").capitalized
    }

    private func formattedSize(_ size: String?) -> String? {
        guard let size, !size.isEmpty else { return nil }
        let labels: [String: String] = [
            "small": "Small",
            "medium": "Medium",
            "large": "Large",
            "extra_large": "Extra large"
        ]
        return labels[size] ?? size.replacingOccurrences(of: "_", with: " ").capitalized
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
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private func lightIcon(_ light: String?) -> String {
        guard let light else { return "sun.max.fill" }
        switch light {
        case "dark":
            return "moon.fill"
        case "low_indirect":
            return "cloud.fill"
        case "medium_indirect":
            return "sun.haze.fill"
        case "bright_indirect":
            return "sun.max.fill"
        case "direct":
            return "sun.max.fill"
        default:
            return "sun.max.fill"
        }
    }

    private func sizeIcon(_ size: String?) -> String {
        guard let size else { return "ruler.fill" }
        switch size {
        case "small":
            return "leaf.fill"
        case "medium":
            return "leaf.fill"
        case "large":
            return "tree.fill"
        case "extra_large":
            return "tree.fill"
        default:
            return "ruler.fill"
        }
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

    private func lightTagline(_ light: String?) -> String? {
        guard let light else { return nil }
        switch light {
        case "dark":
            return "Loves the shadows 🌑"
        case "low_indirect":
            return "Cozy corner dweller ☁️"
        case "medium_indirect":
            return "Just right brightness ✨"
        case "bright_indirect":
            return "Sun-kissed but shaded 🌤️"
        case "direct":
            return "Sunbathing enthusiast ☀️"
        default:
            return nil
        }
    }

    private func locationTagline(_ location: String?) -> String? {
        guard let location, !location.isEmpty else { return nil }
        return "Current home 🏡"
    }

    private func sizeTagline(_ size: String?) -> String? {
        guard let size else { return nil }
        switch size {
        case "small":
            return "Compact cutie 🌱"
        case "medium":
            return "Just the right size 🪴"
        case "large":
            return "Big and beautiful 🌿"
        case "extra_large":
            return "Absolute unit 🌴"
        default:
            return nil
        }
    }

    private func acquiredTagline(_ acquiredAt: String?) -> String? {
        guard let acquiredAt else { return nil }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        let date = formatter.date(from: acquiredAt) ?? ISO8601DateFormatter().date(from: acquiredAt)
        guard let resolvedDate = date else { return nil }

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
