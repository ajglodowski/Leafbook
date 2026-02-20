//
//  PlantTypePhoto.swift
//  Leafbook
//

import Foundation

struct PlantTypePhoto: Identifiable, Codable, Equatable {
    let id: String
    let plantTypeId: String
    let url: String
    let caption: String?
    let isPrimary: Bool?
    let displayOrder: Int?

    enum CodingKeys: String, CodingKey {
        case id
        case plantTypeId = "plant_type_id"
        case url
        case caption
        case isPrimary = "is_primary"
        case displayOrder = "display_order"
    }
}
