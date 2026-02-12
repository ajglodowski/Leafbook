//
//  DashboardUtils.swift
//  Leafbook
//
//  Shared with LeafbookWidget - keep in sync with Leafbook/Models/DashboardUtils.swift
//

import Foundation

enum DashboardUtils {
    private static let isoFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let fallbackFormatter = ISO8601DateFormatter()

    static func buildPhotosByPlant(_ photos: [PlantPhoto]) -> [String: [PlantPhoto]] {
        var byPlant: [String: [PlantPhoto]] = [:]
        photos.forEach { photo in
            byPlant[photo.plantId, default: []].append(photo)
        }
        return byPlant
    }

    static func getThumbnailUrl(plantId: String, photosByPlant: [String: [PlantPhoto]]) -> URL? {
        guard let photo = photosByPlant[plantId]?.first else { return nil }
        return URL(string: photo.url)
    }

    static func formatTimeAgo(_ dateString: String?) -> String {
        guard let dateString, let date = parseDate(dateString) else {
            return "Never"
        }

        let now = Date()
        let diffDays = Calendar.current.dateComponents([.day], from: date, to: now).day ?? 0

        if diffDays == 0 { return "Today" }
        if diffDays == 1 { return "Yesterday" }
        if diffDays < 7 { return "\(diffDays) days ago" }
        if diffDays < 30 {
            let weeks = max(1, diffDays / 7)
            return "\(weeks) week\(weeks > 1 ? "s" : "") ago"
        }
        let months = max(1, diffDays / 30)
        return "\(months) month\(months > 1 ? "s" : "") ago"
    }

    static func getDaysUntilDue(_ dueDate: String?) -> Int {
        guard let dueDate, let date = parseDate(dueDate) else { return Int.max }
        let diff = Calendar.current.dateComponents([.day], from: Date(), to: date).day ?? Int.max
        return diff
    }

    static func parseDate(_ dateString: String) -> Date? {
        if let date = isoFormatter.date(from: dateString) {
            return date
        }
        return fallbackFormatter.date(from: dateString)
    }
}
