//
//  MainTabView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var tabRouter: TabRouter

    var body: some View {
        TabView(selection: $tabRouter.selectedTab) {
            NavigationStack {
                DashboardView()
            }
            .tabItem {
                Label("Dashboard", systemImage: "calendar.badge.checkmark")
            }
            .tag(LeafbookTab.dashboard)

            NavigationStack {
                PlantsListView()
            }
            .tabItem {
                Label("Plants", systemImage: "leaf")
            }
            .tag(LeafbookTab.plants)

            NavigationStack {
                TimelineListView()
            }
            .tabItem {
                Label("Timeline", systemImage: "clock")
            }
            .tag(LeafbookTab.timeline)

            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
            .tag(LeafbookTab.settings)
        }
#if os(macOS) || os(iOS)
        .tabViewStyle(.sidebarAdaptable)
        .labelStyle(.titleAndIcon)
#endif
        .tint(LeafbookColors.primary)
    }
}

#Preview {
    MainTabView()
        .environmentObject(SessionState(isPreview: true))
        .environmentObject(AppearanceSettings())
        .environmentObject(TabRouter())
}
