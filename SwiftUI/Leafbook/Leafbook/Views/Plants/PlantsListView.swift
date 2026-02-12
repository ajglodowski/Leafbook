//
//  PlantsListView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct PlantsListView: View {
    @EnvironmentObject private var sessionState: SessionState
    @State private var viewModel = PlantsViewModel()
    @State private var searchText = ""
    @State private var hasLoadedOnce = false
    @State private var navigationPath = NavigationPath()
    @State private var selectedTab: PlantsListTab = .active

    private var filteredPlants: [Plant] {
        let trimmedQuery = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedQuery.isEmpty else { return viewModel.plants }
        return viewModel.plants.filter { plant in
            plant.name.localizedCaseInsensitiveContains(trimmedQuery)
        }
    }

    private var filteredLegacyPlants: [Plant] {
        let trimmedQuery = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedQuery.isEmpty else { return viewModel.legacyPlants }
        return viewModel.legacyPlants.filter { plant in
            plant.name.localizedCaseInsensitiveContains(trimmedQuery)
        }
    }

    private var headerSubtitle: String {
        let base = "Your personal plant collection"
        let activeCount = viewModel.plants.count
        let legacyCount = viewModel.legacyPlants.count
        var parts: [String] = []
        if activeCount > 0 {
            parts.append("\(activeCount) active plant\(activeCount == 1 ? "" : "s")")
        }
        if legacyCount > 0 {
            parts.append("\(legacyCount) legacy")
        }
        guard !parts.isEmpty else { return base }
        return "\(base) · " + parts.joined(separator: " · ")
    }

    var body: some View {
        NavigationStack(path: $navigationPath) {
            VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("My Plants")
                    .font(.system(.title, design: .serif).weight(.semibold))
                    .foregroundStyle(LeafbookColors.foreground)
                Text(headerSubtitle)
                    .font(.subheadline)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)

            IconLabelTabBar(
                tabs: PlantsListTab.allCases,
                selection: $selectedTab,
                badgeCount: { tab in
                    switch tab {
                    case .active:
                        return viewModel.plants.count
                    case .legacy:
                        return viewModel.legacyPlants.count
                    }
                }
            )
            .fixedSize(horizontal: false, vertical: true)
            .padding(.horizontal, 16)

            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                TextField("Search plants", text: $searchText)
                    .textFieldStyle(.plain)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(LeafbookColors.card)
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(LeafbookColors.muted.opacity(0.6), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .padding(.horizontal, 16)

            List {
                if viewModel.isLoading {
                    HStack {
                        Spacer()
                        ProgressView("Loading plants…")
                        Spacer()
                    }
                    .listRowBackground(LeafbookColors.background)
                }

                if let message = viewModel.errorMessage {
                    Text(message)
                        .font(.footnote)
                        .foregroundStyle(Color.red)
                        .listRowBackground(LeafbookColors.background)
                } else if selectedTab == .active {
                    if filteredPlants.isEmpty && !viewModel.isLoading {
                        if viewModel.plants.isEmpty && searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            EmptyStateView(
                                title: "No plants yet",
                                message: "When you're ready, add your first plant to begin.",
                                systemImage: "leaf"
                            )
                            .listRowBackground(LeafbookColors.background)
                        } else {
                            EmptyStateView(
                                title: "No matches",
                                message: "Try a different name or clear your search.",
                                systemImage: "magnifyingglass"
                            )
                            .listRowBackground(LeafbookColors.background)
                        }
                    } else {
                        ForEach(filteredPlants) { plant in
                            Button {
                                navigationPath.append(plant.id)
                            } label: {
                                PlantRowView(
                                    plant: plant,
                                    taskStatus: viewModel.taskStatus(for: plant),
                                    thumbnailURL: viewModel.thumbnailURL(for: plant)
                                )
                            }
                            .buttonStyle(.plain)
                            .contentShape(Rectangle())
                            .listRowInsets(EdgeInsets(top: 6, leading: 8, bottom: 6, trailing: 0))
                            .listRowSeparator(.hidden)
                            .listRowBackground(LeafbookColors.background)
                        }
                    }
                } else {
                    if filteredLegacyPlants.isEmpty && !viewModel.isLoading {
                        if viewModel.legacyPlants.isEmpty && searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            EmptyStateView(
                                title: "No legacy plants",
                                message: "Legacy plants are those no longer in your active collection. When a plant passes on or is given away, you can mark it as legacy to preserve its history.",
                                systemImage: "archivebox"
                            )
                            .listRowBackground(LeafbookColors.background)
                        } else {
                            EmptyStateView(
                                title: "No matches",
                                message: "Try a different name or clear your search.",
                                systemImage: "magnifyingglass"
                            )
                            .listRowBackground(LeafbookColors.background)
                        }
                    } else {
                        ForEach(filteredLegacyPlants) { plant in
                            Button {
                                navigationPath.append(plant.id)
                            } label: {
                                PlantRowView(
                                    plant: plant,
                                    taskStatus: viewModel.taskStatus(for: plant),
                                    thumbnailURL: viewModel.thumbnailURL(for: plant)
                                )
                            }
                            .buttonStyle(.plain)
                            .contentShape(Rectangle())
                            .listRowInsets(EdgeInsets(top: 6, leading: 8, bottom: 6, trailing: 0))
                            .listRowSeparator(.hidden)
                            .listRowBackground(LeafbookColors.background)
                        }
                    }
                }
            }
            #if os(macOS)
            .listStyle(.inset)
            #else
            .listStyle(.plain)
            #endif
            .scrollContentBackground(.hidden)
            }
            .background(LeafbookColors.background)
            .navigationDestination(for: String.self) { plantId in
                PlantDetailView(plantId: plantId)
            }
            .task(id: sessionState.status) {
                if case let .signedIn(userId) = sessionState.status, !hasLoadedOnce {
                    hasLoadedOnce = true
                    await viewModel.load(userId: userId)
                }
            }
            .refreshable {
                if case let .signedIn(userId) = sessionState.status {
                    hasLoadedOnce = true
                    await viewModel.load(userId: userId)
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        PlantsListView()
    }
    .environmentObject(SessionState(isPreview: true))
}
