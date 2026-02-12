//
//  LeafbookWidget.swift
//  LeafbookWidget
//
//  Created by AJ Glodowski on 2/10/26.
//

import SwiftUI
import WidgetKit

struct LeafbookWidget: Widget {
    let kind: String = "LeafbookPlantCare"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PlantCareTimelineProvider()) { entry in
            LeafbookWidgetView(entry: entry)
                .containerBackground(WidgetColors.card, for: .widget)
        }
        .configurationDisplayName("Plant Care")
        .description("See which plants need attention.")
        .supportedFamilies([.systemMedium])
    }
}
