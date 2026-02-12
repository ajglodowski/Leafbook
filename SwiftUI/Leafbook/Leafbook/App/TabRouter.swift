//
//  TabRouter.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/2/26.
//

import Combine
import SwiftUI

enum LeafbookTab: Hashable {
    case dashboard
    case plants
    case timeline
    case settings
}

@MainActor
final class TabRouter: ObservableObject {
    @Published var selectedTab: LeafbookTab = .dashboard
    @Published var requestedTimelineFeed: TimelineFeed? = nil

    func openPlants() {
        selectedTab = .plants
    }

    func openTimeline(feed: TimelineFeed? = nil) {
        if let feed {
            requestedTimelineFeed = feed
        }
        selectedTab = .timeline
    }
}
