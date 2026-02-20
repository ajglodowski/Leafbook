//
//  TimelineModels.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/1/26.
//

import Foundation
import SwiftUI

enum TimelineFeed: String, CaseIterable, Identifiable {
    case all
    case events
    case journal
    case issues

    var id: String { rawValue }

    var title: String {
        switch self {
        case .all: return "All"
        case .events: return "Events"
        case .journal: return "Journal"
        case .issues: return "Issues"
        }
    }

    var iconName: String {
        switch self {
        case .all: return "rectangle.3.group"
        case .events: return "clock"
        case .journal: return "book"
        case .issues: return "exclamationmark.triangle"
        }
    }
}

enum TimelineItem: Identifiable {
    case event(PlantEvent)
    case journal(JournalEntry)
    case issue(PlantIssue)

    var id: String {
        switch self {
        case .event(let event): return "event-\(event.id)"
        case .journal(let entry): return "journal-\(entry.id)"
        case .issue(let issue): return "issue-\(issue.id)"
        }
    }

    var sortDate: Date? {
        switch self {
        case .event(let event):
            return Self.parseDate(event.eventDate)
        case .journal(let entry):
            return Self.parseDate(entry.entryDate)
        case .issue(let issue):
            return Self.parseDate(issue.resolvedAt ?? issue.startedAt)
        }
    }

    var rawDateString: String? {
        switch self {
        case .event(let event):
            return event.eventDate
        case .journal(let entry):
            return entry.entryDate
        case .issue(let issue):
            return issue.resolvedAt ?? issue.startedAt
        }
    }

    var plantId: String? {
        switch self {
        case .event(let event):
            return event.plantId
        case .journal(let entry):
            return entry.plantId
        case .issue(let issue):
            return issue.plantId
        }
    }

    var dotColor: Color {
        switch self {
        case .event(let event): return event.eventType.badgeColor
        case .journal: return LeafbookColors.primary
        case .issue: return LeafbookColors.issueOrange
        }
    }

    private static func parseDate(_ dateString: String?) -> Date? {
        guard let dateString else { return nil }
        return DashboardUtils.parseDate(dateString)
    }
}

enum TimelineViewMode: String, CaseIterable {
    case list
    case calendar
}

struct IdentifiableDate: Identifiable {
    let id: TimeInterval
    let date: Date
    init(_ date: Date) {
        self.date = date
        self.id = date.timeIntervalSince1970
    }
}
