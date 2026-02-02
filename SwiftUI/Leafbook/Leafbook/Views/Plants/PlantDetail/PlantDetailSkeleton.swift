//
//  PlantDetailSkeleton.swift
//  Leafbook
//
//  A loading skeleton that mimics the PlantDetailView layout.
//

import SwiftUI

struct PlantDetailSkeleton: View {
    @State private var isAnimating = false

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 16) {
                // Hero skeleton
                heroSkeleton

                // Tab picker skeleton
                skeletonRect(height: 32)
                    .frame(maxWidth: .infinity)

                // Content skeleton
                VStack(alignment: .leading, spacing: 16) {
                    // Quick actions card skeleton
                    cardSkeleton(lines: 2)

                    // Quick facts card skeleton
                    cardSkeleton(lines: 5)

                    // Care status card skeleton
                    cardSkeleton(lines: 3)
                }
            }
            .padding()
        }
        .background(LeafbookColors.background)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }

    private var heroSkeleton: some View {
        ZStack {
            // Background gradient
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            LeafbookColors.primary.opacity(0.08),
                            LeafbookColors.muted.opacity(0.3)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            HStack(spacing: 20) {
                // Photo skeleton
                skeletonRect(width: 160, height: 160)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                // Info skeleton
                VStack(alignment: .leading, spacing: 12) {
                    skeletonRect(height: 28)
                        .frame(width: 140)
                    skeletonRect(height: 16)
                        .frame(width: 100)
                    skeletonRect(height: 14)
                        .frame(width: 80)

                    HStack(spacing: 8) {
                        skeletonRect(height: 24)
                            .frame(width: 70)
                        skeletonRect(height: 24)
                            .frame(width: 90)
                    }
                    .padding(.top, 4)

                    HStack(spacing: 8) {
                        skeletonRect(height: 36)
                            .frame(width: 80)
                        skeletonRect(height: 36)
                            .frame(width: 80)
                    }
                    .padding(.top, 8)
                }

                Spacer()
            }
            .padding(20)
        }
        .frame(minHeight: 200)
    }

    private func cardSkeleton(lines: Int) -> some View {
        LeafbookCard {
            VStack(alignment: .leading, spacing: 12) {
                skeletonRect(height: 20)
                    .frame(width: 120)
                ForEach(0..<lines, id: \.self) { index in
                    HStack {
                        skeletonRect(height: 14)
                            .frame(width: CGFloat.random(in: 60...100))
                        Spacer()
                        skeletonRect(height: 14)
                            .frame(width: CGFloat.random(in: 80...140))
                    }
                }
            }
        }
    }

    private func skeletonRect(width: CGFloat? = nil, height: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: 6, style: .continuous)
            .fill(LeafbookColors.muted)
            .frame(width: width, height: height)
            .opacity(isAnimating ? 0.4 : 0.7)
    }
}

#Preview {
    NavigationStack {
        PlantDetailSkeleton()
            .navigationTitle("Loading...")
    }
}
