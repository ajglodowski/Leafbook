//
//  MainTabView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            NavigationStack {
                DashboardView()
            }
            .tabItem {
                Label("Dashboard", systemImage: "calendar.badge.checkmark")
            }

            NavigationStack {
                PlantsListView()
            }
            .tabItem {
                Label("Plants", systemImage: "leaf")
            }

            NavigationStack {
                TimelineListView()
            }
            .tabItem {
                Label("Timeline", systemImage: "clock")
            }

            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
        }
#if os(macOS)
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
}
