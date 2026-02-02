//
//  DashboardUtils.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/29/26.
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

    static func formatJournalDate(_ dateString: String) -> String {
        guard let date = parseDate(dateString) else { return dateString }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.setLocalizedDateFormatFromTemplate("MMM d")
        return formatter.string(from: date)
    }

    static func getGreeting() -> (greeting: String, subtext: String) {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 0..<6:
            return ("Burning the midnight oil?", "Your plants are sleeping soundly.")
        case 6..<12:
            return ("Good morning", "A new day to watch things grow.")
        case 12..<17:
            return ("Good afternoon", "Perfect light for a quick check-in.")
        case 17..<21:
            return ("Good evening", "Time to unwind with your leafy friends.")
        default:
            return ("Evening", "The plants are winding down too.")
        }
    }

    static func getSpotlightMessage(plant: DashboardSpotlightPlant) -> String {
        let messages = [
            "How's \(plant.name) doing today?",
            "\(plant.name) could use some attention",
            "Check in on \(plant.name)",
            "\(plant.name) is waiting for you",
            "Time for a moment with \(plant.name)?",
        ]
        let index = abs(plant.id.hashValue) % messages.count
        return messages[index]
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
