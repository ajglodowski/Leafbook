//
//  IconLabelTabBar.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/31/26.
//

import SwiftUI

protocol IconLabelTabItem: Identifiable, Hashable {
    var title: String { get }
    var iconName: String { get }
}

struct IconLabelTabBar<Tab: IconLabelTabItem>: View {
    let tabs: [Tab]
    @Binding var selection: Tab
    let badgeCount: ((Tab) -> Int)?

    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.colorScheme) private var colorScheme

    init(
        tabs: [Tab],
        selection: Binding<Tab>,
        badgeCount: ((Tab) -> Int)? = nil
    ) {
        self.tabs = tabs
        self._selection = selection
        self.badgeCount = badgeCount
    }

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            LazyHStack(spacing: isCompactWidth ? 1 : 2) {
                ForEach(tabs) { tab in
                    Button {
                        selection = tab
                    } label: {
                        VStack(spacing: 2) {
                            ZStack(alignment: .topTrailing) {
                                Image(systemName: tab.iconName)
                                    .font(.system(size: isCompactWidth ? 14 : 16, weight: .semibold))

                                if let badgeValue = badgeValue(for: tab) {
                                    Text(badgeValue)
                                        .font(.caption2.weight(.bold))
                                        .foregroundStyle(Color.white)
                                        .padding(.horizontal, 5)
                                        .padding(.vertical, 2)
                                        .background(
                                            Capsule(style: .continuous)
                                                .fill(primaryColor)
                                        )
                                        .offset(x: 12, y: -8)
                                }
                            }

                            Text(tab.title)
                                .font(.caption2.weight(.semibold))
                        }
                        .frame(minWidth: isCompactWidth ? 62 : 78)
                        .padding(.vertical, isCompactWidth ? 8 : 10)
                        .padding(.horizontal, isCompactWidth ? 10 : 12)
                        .foregroundStyle(selection == tab ? primaryColor : foregroundColor)
                        .background(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .fill(selection == tab ? primaryColor.opacity(0.18) : Color.clear)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 4)
            .padding(.vertical, 4)
            .background(
                RoundedRectangle(cornerRadius: isCompactWidth ? 16 : 18, style: .continuous)
                    .fill(cardColor)
            )
            .clipShape(RoundedRectangle(cornerRadius: isCompactWidth ? 16 : 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: isCompactWidth ? 16 : 18, style: .continuous)
                    .stroke(foregroundColor.opacity(0.1), lineWidth: 1)
            )
        }
    }

    private var isCompactWidth: Bool {
        horizontalSizeClass == .compact
    }

    private var foregroundColor: Color {
        colorScheme == .dark ? LeafbookColors.foregroundDark : LeafbookColors.foregroundLight
    }

    private var primaryColor: Color {
        colorScheme == .dark ? LeafbookColors.primaryDark : LeafbookColors.primaryLight
    }

    private var cardColor: Color {
        colorScheme == .dark ? LeafbookColors.cardDark : LeafbookColors.cardLight
    }

    private func badgeValue(for tab: Tab) -> String? {
        guard let badgeCount, let count = Optional(badgeCount(tab)), count > 0 else { return nil }
        return count > 99 ? "99+" : "\(count)"
    }
}

private enum IconLabelTabExampleTab: String, CaseIterable, Identifiable {
    case first
    case second
    case third

    var id: String { rawValue }

    var title: String {
        switch self {
        case .first: return "Overview"
        case .second: return "Journal"
        case .third: return "Issues"
        }
    }

    var iconName: String {
        switch self {
        case .first: return "leaf.fill"
        case .second: return "book.fill"
        case .third: return "exclamationmark.triangle.fill"
        }
    }
}

extension IconLabelTabExampleTab: @MainActor IconLabelTabItem {}

#Preview {
    return VStack(spacing: 24) {
        IconLabelTabBar(tabs: IconLabelTabExampleTab.allCases, selection: .constant(.first))
    }
    .padding()
    .background(LeafbookColors.background)
}
