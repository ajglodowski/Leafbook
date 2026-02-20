//
//  PlantCatalogView.swift
//  Leafbook
//

import SwiftUI

struct PlantCatalogView: View {
    @State private var viewModel = CatalogViewModel()

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            VStack(alignment: .leading, spacing: 4) {
                Text("Catalog")
                    .font(.system(.title, design: .serif).weight(.semibold))
                    .foregroundStyle(LeafbookColors.foreground)
                Text(subtitleText)
                    .font(.subheadline)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)

            // Search bar
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.5))
                TextField("Search by name or type", text: $viewModel.searchText)
                    .textFieldStyle(.plain)
                    .onChange(of: viewModel.searchText) { viewModel.resetPagination() }
                if !viewModel.searchText.isEmpty {
                    Button {
                        viewModel.searchText = ""
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.4))
                    }
                    .buttonStyle(.plain)
                }
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

            // Filter chips
            filterRow

            // Content
            if viewModel.isLoading && !viewModel.hasLoadedData {
                Spacer()
                HStack {
                    Spacer()
                    ProgressView("Loading catalog…")
                    Spacer()
                }
                Spacer()
            } else if let error = viewModel.errorMessage {
                EmptyStateView(
                    title: "Couldn't load catalog",
                    message: error,
                    systemImage: "exclamationmark.triangle"
                )
                .padding(.top, 40)
            } else if viewModel.filteredPlantTypes.isEmpty {
                EmptyStateView(
                    title: viewModel.searchText.isEmpty && !viewModel.hasActiveFilters ? "No plant types" : "No matches",
                    message: viewModel.searchText.isEmpty && !viewModel.hasActiveFilters
                        ? "The catalog is empty."
                        : "Try adjusting your search or filters.",
                    systemImage: "magnifyingglass"
                )
                .padding(.top, 40)
            } else {
                catalogGrid
            }
        }
        .background(LeafbookColors.background)
        .navigationTitle("Catalog")
        .task {
            await viewModel.load()
        }
        .refreshable {
            await viewModel.refresh()
        }
    }

    // MARK: - Subviews

    private var subtitleText: String {
        let total = viewModel.plantTypes.count
        let filtered = viewModel.filteredPlantTypes.count
        if viewModel.hasActiveFilters || !viewModel.searchText.isEmpty {
            return "\(filtered) of \(total) plant type\(total == 1 ? "" : "s")"
        }
        return "\(total) plant type\(total == 1 ? "" : "s")"
    }

    private var filterRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                // Light filter
                Menu {
                    Button("Any light") { viewModel.selectedLight = nil }
                    ForEach(PlantLightLevel.allCases, id: \.self) { level in
                        Button(level.label) { viewModel.selectedLight = level; viewModel.resetPagination() }
                    }
                } label: {
                    filterChip(
                        label: viewModel.selectedLight?.label ?? "Light",
                        icon: "sun.max",
                        isActive: viewModel.selectedLight != nil
                    )
                }

                // Size filter
                Menu {
                    Button("Any size") { viewModel.selectedSize = nil }
                    ForEach(PlantSize.allCases, id: \.self) { size in
                        Button(size.label) { viewModel.selectedSize = size; viewModel.resetPagination() }
                    }
                } label: {
                    filterChip(
                        label: viewModel.selectedSize?.label ?? "Size",
                        icon: "ruler",
                        isActive: viewModel.selectedSize != nil
                    )
                }

                // Clear filters
                if viewModel.hasActiveFilters {
                    Button {
                        viewModel.clearFilters()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "xmark")
                                .font(.caption.weight(.semibold))
                            Text("Clear")
                                .font(.subheadline.weight(.medium))
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .foregroundStyle(LeafbookColors.foreground)
                        .background(LeafbookColors.muted.opacity(0.5))
                        .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
        }
    }

    private func filterChip(label: String, icon: String, isActive: Bool) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption.weight(.semibold))
            Text(label)
                .font(.subheadline.weight(.medium))
            Image(systemName: "chevron.down")
                .font(.caption2.weight(.semibold))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .foregroundStyle(isActive ? LeafbookColors.background : LeafbookColors.foreground)
        .background(isActive ? LeafbookColors.primary : LeafbookColors.muted.opacity(0.5))
        .clipShape(Capsule())
    }

    private var catalogGrid: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.displayedPlantTypes) { plantType in
                    NavigationLink {
                        PlantTypeDetailView(plantType: plantType)
                    } label: {
                        PlantTypeCatalogCard(
                            plantType: plantType,
                            photoURL: viewModel.primaryPhotoURL(for: plantType)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)

            // Load More
            if viewModel.hasMore {
                Button {
                    viewModel.loadMore()
                } label: {
                    Text("Load more")
                        .font(.subheadline.weight(.medium))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(LeafbookColors.card)
                        .foregroundStyle(LeafbookColors.foreground)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(LeafbookColors.muted.opacity(0.5), lineWidth: 1)
                        )
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 16)
                .padding(.top, 4)
            }

            Color.clear.frame(height: 16)
        }
    }
}

#Preview {
    NavigationStack {
        PlantCatalogView()
    }
}
