//
//  CalendarDaySheetView.swift
//  Leafbook
//

import SwiftUI

struct CalendarDaySheetView: View {
    let date: Date
    let items: [TimelineItem]
    let thumbnailURL: (TimelineItem) -> URL?
    let linkedEventLabel: (TimelineItem) -> String?
    let onEdit: (TimelineItem) -> (() -> Void)?
    var showPlantNavigation: Bool = true

    private var dateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter
    }

    private var headerFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMMM d"
        return formatter
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    Text(headerFormatter.string(from: date))
                        .font(.system(.title3, design: .serif).weight(.semibold))
                        .foregroundStyle(LeafbookColors.foreground)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    if items.isEmpty {
                        EmptyStateView(
                            title: "No activity",
                            message: "Nothing logged on this day.",
                            systemImage: "calendar"
                        )
                        .padding(.top, 20)
                    } else {
                        LazyVStack(spacing: 12) {
                            ForEach(items) { item in
                                if showPlantNavigation, let plantId = item.plantId {
                                    NavigationLink(destination: PlantDetailView(plantId: plantId)) {
                                        TimelineItemCard(
                                            item: item,
                                            thumbnailURL: thumbnailURL(item),
                                            linkedEventLabel: linkedEventLabel(item),
                                            dateFormatter: dateFormatter,
                                            onEdit: onEdit(item)
                                        )
                                    }
                                    .buttonStyle(.plain)
                                } else {
                                    TimelineItemCard(
                                        item: item,
                                        thumbnailURL: thumbnailURL(item),
                                        linkedEventLabel: linkedEventLabel(item),
                                        dateFormatter: dateFormatter,
                                        onEdit: onEdit(item)
                                    )
                                }
                            }
                        }
                    }
                }
                .padding()
            }
            .background(LeafbookColors.background)
        }
        .refreshable {}
    }
}
