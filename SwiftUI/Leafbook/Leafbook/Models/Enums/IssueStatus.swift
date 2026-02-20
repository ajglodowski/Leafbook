//
//  IssueStatus.swift
//  Leafbook
//
//  Created by Claude on 2/12/26.
//

import SwiftUI

enum IssueStatus: String, Codable, CaseIterable, Identifiable {
    case active
    case resolved
    case monitoring

    var id: String { rawValue }

    var displayName: String { rawValue.capitalized }

    var symbolName: String {
        switch self {
        case .active: return "exclamationmark.triangle.fill"
        case .resolved: return "checkmark.circle.fill"
        case .monitoring: return "eye.fill"
        }
    }

    var badgeColor: Color {
        switch self {
        case .active: return LeafbookColors.roseAccent
        case .resolved: return .green
        case .monitoring: return LeafbookColors.fertilizerAmber
        }
    }
}
