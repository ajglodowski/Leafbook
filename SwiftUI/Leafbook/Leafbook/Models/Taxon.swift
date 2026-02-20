//
//  Taxon.swift
//  Leafbook
//

import Foundation

struct Taxon: Identifiable, Codable, Equatable {
    let id: String
    let wikidataQid: String
    let rank: String?
    let scientificName: String?
    let commonName: String?

    enum CodingKeys: String, CodingKey {
        case id
        case wikidataQid = "wikidata_qid"
        case rank
        case scientificName = "scientific_name"
        case commonName = "common_name"
    }

    var displayName: String {
        commonName ?? scientificName ?? "Unknown"
    }
}
