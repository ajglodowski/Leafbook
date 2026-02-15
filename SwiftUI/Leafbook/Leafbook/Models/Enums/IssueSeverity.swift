//
//  IssueSeverity.swift
//  Leafbook
//
//  Created by Claude on 2/12/26.
//

import Foundation
import SwiftUI

enum IssueSeverity: String, Codable, CaseIterable, Identifiable {
    case low
    case medium
    case high
    case critical

    var id: String { rawValue }

    var displayName: String { rawValue.capitalized }

    var colorIndicator: Color {
        switch self {
        case .low:
            return LeafbookColors.primary
        case .medium:
            return LeafbookColors.fertilizerAmber
        case .high:
            return LeafbookColors.roseAccent
        case .critical:
            return .red
        }
    }
}
