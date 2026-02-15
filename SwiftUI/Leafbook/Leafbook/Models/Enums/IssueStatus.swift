//
//  IssueStatus.swift
//  Leafbook
//
//  Created by Claude on 2/12/26.
//

import Foundation

enum IssueStatus: String, Codable, CaseIterable, Identifiable {
    case active
    case resolved
    case monitoring

    var id: String { rawValue }

    var displayName: String { rawValue.capitalized }

    // Add helper properties as needed (e.g., badge colors)
}
