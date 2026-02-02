//
//  DashboardHeaderSectionView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/29/26.
//

import SwiftUI

struct DashboardHeaderSectionView: View {
    let summary: DashboardSummary

    private var greeting: (greeting: String, subtext: String) {
        DashboardUtils.getGreeting()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(headerTitle)
                    .font(.system(.title2, design: .serif).weight(.semibold))
                    .foregroundStyle(LeafbookColors.foreground)
                Text(greeting.subtext)
                    .font(.subheadline)
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
            }

            if summary.hasPlants {
                HStack(spacing: 8) {
                    NavigationLink {
                        PlantsListView()
                    } label: {
                        DashboardBadge(
                            label: "\(summary.activePlantCount) plant\(summary.activePlantCount == 1 ? "" : "s")",
                            systemImage: "leaf.fill",
                            tint: LeafbookColors.primary
                        )
                    }

                    if summary.wishlistCount > 0 {
                        NavigationLink {
                            WishlistView()
                        } label: {
                            DashboardBadge(
                                label: "\(summary.wishlistCount) on wishlist",
                                systemImage: "heart.fill",
                                tint: LeafbookColors.roseAccent
                            )
                        }
                    }

                    if summary.activeIssueCount > 0 {
                        NavigationLink {
                            TimelineListView()
                        } label: {
                            DashboardBadge(
                                label: "\(summary.activeIssueCount) active issue\(summary.activeIssueCount == 1 ? "" : "s")",
                                systemImage: "exclamationmark.triangle.fill",
                                tint: LeafbookColors.issueOrange
                            )
                        }
                    }
                }
                .font(.caption)
            }
        }
    }

    private var headerTitle: String {
        if let displayName = summary.profile?.displayName, !displayName.isEmpty {
            return "\(greeting.greeting), \(displayName)"
        }
        return greeting.greeting
    }
}

private struct DashboardBadge: View {
    let label: String
    let systemImage: String
    let tint: Color

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: systemImage)
                .font(.caption)
            Text(label)
                .font(.caption.weight(.medium))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(tint.opacity(0.15))
        .foregroundStyle(tint)
        .clipShape(Capsule())
    }
}

#Preview {
    NavigationStack {
        DashboardHeaderSectionView(summary: .preview)
            .padding()
            .background(LeafbookColors.background)
    }
}
