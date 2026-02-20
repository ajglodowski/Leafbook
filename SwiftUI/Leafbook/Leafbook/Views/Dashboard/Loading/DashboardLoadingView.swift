//
//  DashboardLoadingView.swift
//  Leafbook
//
//  Created by GPT-5.1 Codex Mini on 1/31/26.
//

import SwiftUI

struct DashboardLoadingView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 10) {
                    LoadingLine(width: 220, height: 26)
                    LoadingLine(width: 180, height: 14)
                    HStack(spacing: 8) {
                        LoadingCapsule(width: 110)
                        LoadingCapsule(width: 90)
                        LoadingCapsule(width: 120)
                    }
                }

                LeafbookCard {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 8) {
                            LoadingCircle(size: 16)
                            LoadingLine(width: 170, height: 16)
                        }
                        LoadingLine(width: 200, height: 14)
                        LoadingLine(width: 260, height: 14)
                        LoadingLine(width: 120, height: 12)
                        HStack(spacing: 12) {
                            LoadingPillButton(width: 90)
                            LoadingPillButton(width: 90)
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        LoadingLine(width: 190, height: 20)
                        Spacer()
                        LoadingCapsule(width: 90)
                    }
                    LoadingLine(width: 90, height: 14)
                    VStack(spacing: 8) {
                        DashboardLoadingRow()
                        DashboardLoadingRow()
                        DashboardLoadingRow()
                    }
                    LoadingLine(width: 120, height: 12)
                }

                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        LoadingLine(width: 200, height: 20)
                        Spacer()
                        LoadingCapsule(width: 100)
                    }
                    LoadingLine(width: 100, height: 14)
                    VStack(spacing: 8) {
                        DashboardLoadingRow()
                        DashboardLoadingRow()
                    }
                }

                VStack(spacing: 12) {
                    LeafbookCard {
                        VStack(alignment: .leading, spacing: 12) {
                            LoadingLine(width: 150, height: 16)
                            LoadingLine(width: 240, height: 14)
                            HStack(alignment: .top, spacing: 12) {
                                LoadingThumbnail(size: 80)
                                VStack(alignment: .leading, spacing: 6) {
                                    LoadingLine(width: 140, height: 16)
                                    LoadingLine(width: 110, height: 12)
                                    LoadingLine(width: 180, height: 12)
                                }
                            }
                            HStack(spacing: 12) {
                                LoadingPillButton(width: 120)
                                LoadingPillButton(width: 120)
                            }
                        }
                    }

                    LeafbookCard {
                        VStack(alignment: .leading, spacing: 12) {
                            LoadingLine(width: 140, height: 16)
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                                LoadingActionTile()
                                LoadingActionTile()
                                LoadingActionTile()
                                LoadingActionTile()
                            }
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        LoadingLine(width: 210, height: 20)
                        Spacer()
                        LoadingLine(width: 60, height: 14)
                    }
                    VStack(spacing: 8) {
                        DashboardLoadingRow()
                        DashboardLoadingRow()
                    }
                }
            }
            .padding()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(LeafbookColors.background)
    }
}

private struct DashboardLoadingRow: View {
    var body: some View {
        LeafbookCard(verticalPadding: 10, horizontalPadding: 12) {
            HStack(spacing: 12) {
                LoadingThumbnail(size: 44)
                VStack(alignment: .leading, spacing: 6) {
                    LoadingLine(width: 140, height: 14)
                    LoadingLine(width: 120, height: 12)
                }
                Spacer()
                LoadingPillButton(width: 48, height: 26)
            }
        }
    }
}

private struct LoadingLine: View {
    let width: CGFloat?
    let height: CGFloat

    init(width: CGFloat? = nil, height: CGFloat = 12) {
        self.width = width
        self.height = height
    }

    var body: some View {
        RoundedRectangle(cornerRadius: 4, style: .continuous)
            .fill(LeafbookColors.foreground.opacity(0.15))
            .frame(height: height)
            .frame(maxWidth: width ?? .infinity, alignment: .leading)
    }
}

private struct LoadingCapsule: View {
    let width: CGFloat

    var body: some View {
        Capsule(style: .continuous)
            .fill(LeafbookColors.foreground.opacity(0.12))
            .frame(width: width, height: 24)
    }
}

private struct LoadingPillButton: View {
    let width: CGFloat
    let height: CGFloat

    init(width: CGFloat, height: CGFloat = 32) {
        self.width = width
        self.height = height
    }

    var body: some View {
        Capsule(style: .continuous)
            .fill(LeafbookColors.foreground.opacity(0.14))
            .frame(width: width, height: height)
    }
}

private struct LoadingThumbnail: View {
    let size: CGFloat

    var body: some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous)
            .fill(LeafbookColors.muted.opacity(0.7))
            .frame(width: size, height: size)
    }
}

private struct LoadingCircle: View {
    let size: CGFloat

    var body: some View {
        Circle()
            .fill(LeafbookColors.foreground.opacity(0.15))
            .frame(width: size, height: size)
    }
}

private struct LoadingActionTile: View {
    var body: some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous)
            .fill(LeafbookColors.muted.opacity(0.5))
            .frame(minHeight: 60)
    }
}

#Preview {
    DashboardLoadingView()
        .padding(.vertical)
        .background(LeafbookColors.background)
}
