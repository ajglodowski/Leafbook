//
//  TaxonEdge.swift
//  Leafbook
//

import Foundation

struct TaxonEdge: Codable, Equatable {
    let parentTaxonId: String
    let childTaxonId: String

    enum CodingKeys: String, CodingKey {
        case parentTaxonId = "parent_taxon_id"
        case childTaxonId = "child_taxon_id"
    }
}
