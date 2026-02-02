//
//  DashboardSummary.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Foundation

struct DashboardSummary: Equatable {
    let profile: DashboardProfile?
    let activePlantCount: Int
    let wishlistCount: Int
    let activeIssueCount: Int
    let dueTasks: [PlantDueTask]
    let scheduleSuggestions: [DashboardScheduleSuggestion]
    let spotlightPlants: [DashboardSpotlightPlant]
    let recentJournalEntries: [JournalEntry]
    let plantPhotos: [PlantPhoto]

    var hasPlants: Bool {
        activePlantCount > 0
    }

    static let empty = DashboardSummary(
        profile: nil,
        activePlantCount: 0,
        wishlistCount: 0,
        activeIssueCount: 0,
        dueTasks: [],
        scheduleSuggestions: [],
        spotlightPlants: [],
        recentJournalEntries: [],
        plantPhotos: []
    )

    static let preview = DashboardSummary(
        profile: .preview,
        activePlantCount: 12,
        wishlistCount: 2,
        activeIssueCount: 1,
        dueTasks: [.preview],
        scheduleSuggestions: [.preview],
        spotlightPlants: [.preview],
        recentJournalEntries: [.preview],
        plantPhotos: [.preview]
    )
}
