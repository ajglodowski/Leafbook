//
//  DashboardView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var sessionState: SessionState
    @State private var viewModel: DashboardViewModel

    init(viewModel: DashboardViewModel = .init()) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        Group {
            if isShowingInitialLoading {
                DashboardLoadingView()
            } else {
                dashboardContent
            }
        }
        .background(LeafbookColors.background)
//        .navigationTitle("Today")
        .task {
            if case let .signedIn(userId) = sessionState.status {
                await viewModel.load(userId: userId)
            }
        }
        .refreshable {
            if case let .signedIn(userId) = sessionState.status {
                await viewModel.load(userId: userId)
            }
        }
        .overlay(alignment: .topTrailing) {
            if viewModel.isLoading && !isShowingInitialLoading {
                ProgressView()
                    .padding()
            }
        }
    }

    private var dashboardContent: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                if let errorMessage = viewModel.errorMessage {
                    LeafbookCard {
                        Text(errorMessage)
                            .font(.subheadline)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.8))
                    }
                }

                DashboardHeaderSectionView(summary: viewModel.summary)

                ScheduleSuggestionsSectionView(
                    suggestions: viewModel.summary.scheduleSuggestions,
                    onAccept: { suggestion in
                        handleSuggestionAction(suggestionId: suggestion.id, isAccept: true)
                    },
                    onDismiss: { suggestion in
                        handleSuggestionAction(suggestionId: suggestion.id, isAccept: false)
                    }
                )

                CareTasksSectionView(
                    tasks: viewModel.summary.dueTasks,
                    hasPlants: viewModel.summary.hasPlants,
                    photosByPlantId: photosByPlantId,
                    onWater: { plantId, date in
                        logCareEvent(plantId: plantId, eventType: .watered, eventDate: date)
                    },
                    onFertilize: { plantId, date in
                        logCareEvent(plantId: plantId, eventType: .fertilized, eventDate: date)
                    }
                )

                UpcomingWaterSectionView(
                    tasks: viewModel.summary.dueTasks,
                    photosByPlantId: photosByPlantId,
                    onWater: { plantId, date in
                        logCareEvent(plantId: plantId, eventType: .watered, eventDate: date)
                    }
                )

                SpotlightActionsSectionView(
                    plants: viewModel.summary.spotlightPlants,
                    hasPlants: viewModel.summary.hasPlants
                )

                RecentJournalSectionView(
                    entries: viewModel.summary.recentJournalEntries,
                    photosByPlantId: photosByPlantId
                )

                EmptyStateSectionView(hasPlants: viewModel.summary.hasPlants)
            }
            .padding()
        }
    }

    private var isShowingInitialLoading: Bool {
        viewModel.isLoading && viewModel.summary == .empty
    }

    private var photosByPlantId: [String: [PlantPhoto]] {
        DashboardUtils.buildPhotosByPlant(viewModel.summary.plantPhotos)
    }

    private func logCareEvent(plantId: String, eventType: TimelineEventType, eventDate: Date = Date()) {
        guard case let .signedIn(userId) = sessionState.status else { return }
        Task {
            _ = await viewModel.logCareEvent(
                userId: userId,
                plantId: plantId,
                eventType: eventType,
                eventDate: eventDate
            )
        }
    }

    private func handleSuggestionAction(suggestionId: String, isAccept: Bool) {
        guard case let .signedIn(userId) = sessionState.status else { return }
        Task {
            if isAccept {
                _ = await viewModel.acceptSuggestion(userId: userId, suggestionId: suggestionId)
            } else {
                _ = await viewModel.dismissSuggestion(userId: userId, suggestionId: suggestionId)
            }
        }
    }
}

#Preview {
    DashboardView(viewModel: DashboardViewModel(initialSummary: .preview))
        .environmentObject(SessionState(isPreview: true))
        .environmentObject(TabRouter())
        .padding(.vertical)
}
