//
//  PlantsListTab.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/2/26.
//

enum PlantsListTab: String, CaseIterable, Identifiable, Hashable {
    case active
    case legacy

    var id: String { rawValue }

    var title: String {
        switch self {
        case .active:
            return "Active"
        case .legacy:
            return "Legacy"
        }
    }

    var iconName: String {
        switch self {
        case .active:
            return "leaf.fill"
        case .legacy:
            return "archivebox.fill"
        }
    }
}

extension PlantsListTab: @MainActor IconLabelTabItem {}
