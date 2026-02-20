//
//  TaxonomyTreeBuilder.swift
//  Leafbook
//

import Foundation

// MARK: - Data Types

struct TaxonomyPlantSummary: Identifiable, Equatable {
    let id: String
    let name: String
    let nickname: String?
    let activePhotoId: String?
    let plantTypeName: String?
    let plantTypeId: String?

    var displayName: String {
        nickname ?? name
    }
}

struct CompactedTreeNode: Identifiable {
    var id: String { path.last?.id ?? UUID().uuidString }
    let path: [Taxon]
    let children: [CompactedTreeNode]
    let plants: [TaxonomyPlantSummary]
    let plantCount: Int
    let isBranchPoint: Bool
    let isLeaf: Bool
}

struct CompactedTaxonomyTree {
    let roots: [CompactedTreeNode]
    let totalPlants: Int
    let plantsWithoutTaxon: [TaxonomyPlantSummary]
}

// MARK: - Internal Tree Node (before compaction)

private struct TaxonomyTreeNode {
    let taxon: Taxon
    let children: [TaxonomyTreeNode]
    let plants: [TaxonomyPlantSummary]
    let plantCount: Int
}

// MARK: - Builder

enum TaxonomyTreeBuilder {

    static func buildCompactedTree(
        plants: [Plant],
        taxa: [Taxon],
        edges: [TaxonEdge]
    ) -> CompactedTaxonomyTree {
        let tree = buildTree(plants: plants, taxa: taxa, edges: edges)
        return compactTree(tree)
    }

    // MARK: - Full Tree

    private struct FullTree {
        let roots: [TaxonomyTreeNode]
        let totalPlants: Int
        let plantsWithoutTaxon: [TaxonomyPlantSummary]
    }

    private static func buildTree(
        plants: [Plant],
        taxa: [Taxon],
        edges: [TaxonEdge]
    ) -> FullTree {
        // Lookup maps
        let taxaById = Dictionary(uniqueKeysWithValues: taxa.map { ($0.id, $0) })

        // Parent-child maps
        var childrenMap: [String: [String]] = [:]
        var parentMap: [String: String] = [:]

        for edge in edges {
            parentMap[edge.childTaxonId] = edge.parentTaxonId
            childrenMap[edge.parentTaxonId, default: []].append(edge.childTaxonId)
        }

        // Group plants by taxon_id
        var plantsByTaxonId: [String: [TaxonomyPlantSummary]] = [:]
        var plantsWithoutTaxon: [TaxonomyPlantSummary] = []

        for plant in plants {
            let summary = TaxonomyPlantSummary(
                id: plant.id,
                name: plant.name,
                nickname: plant.nickname,
                activePhotoId: plant.activePhotoId,
                plantTypeName: plant.plantTypes?.name,
                plantTypeId: plant.plantTypeId
            )

            if let taxonId = plant.plantTypes?.taxonId, taxaById[taxonId] != nil {
                plantsByTaxonId[taxonId, default: []].append(summary)
            } else {
                plantsWithoutTaxon.append(summary)
            }
        }

        // Find relevant taxa (those with plants or ancestors of taxa with plants)
        var relevantTaxonIds = Set<String>()
        for taxonId in plantsByTaxonId.keys {
            var currentId: String? = taxonId
            while let id = currentId {
                relevantTaxonIds.insert(id)
                currentId = parentMap[id]
            }
        }

        // Recursive node builder
        func buildNode(_ taxonId: String) -> TaxonomyTreeNode? {
            guard let taxon = taxaById[taxonId] else { return nil }

            let childIds = childrenMap[taxonId] ?? []
            let childNodes = childIds
                .filter { relevantTaxonIds.contains($0) }
                .compactMap { buildNode($0) }
                .sorted { $0.taxon.displayName.localizedCaseInsensitiveCompare($1.taxon.displayName) == .orderedAscending }

            let directPlants = plantsByTaxonId[taxonId] ?? []
            let descendantCount = childNodes.reduce(0) { $0 + $1.plantCount }

            return TaxonomyTreeNode(
                taxon: taxon,
                children: childNodes,
                plants: directPlants,
                plantCount: directPlants.count + descendantCount
            )
        }

        // Find root nodes
        let rootIds = relevantTaxonIds.filter { taxonId in
            guard let parentId = parentMap[taxonId] else { return true }
            return !relevantTaxonIds.contains(parentId)
        }

        let roots = rootIds
            .compactMap { buildNode($0) }
            .sorted { $0.taxon.displayName.localizedCaseInsensitiveCompare($1.taxon.displayName) == .orderedAscending }

        return FullTree(
            roots: roots,
            totalPlants: plants.count,
            plantsWithoutTaxon: plantsWithoutTaxon
        )
    }

    // MARK: - Compaction

    private static func compactTree(_ tree: FullTree) -> CompactedTaxonomyTree {
        func compactNode(_ node: TaxonomyTreeNode, accumulatedPath: [Taxon] = []) -> CompactedTreeNode {
            let currentPath = accumulatedPath + [node.taxon]

            // If exactly one child and no direct plants, continue collapsing
            if node.children.count == 1 && node.plants.isEmpty {
                return compactNode(node.children[0], accumulatedPath: currentPath)
            }

            // Stopping point - create compacted node
            let compactedChildren = node.children
                .map { compactNode($0) }
                .sorted {
                    let nameA = $0.path.first?.displayName ?? ""
                    let nameB = $1.path.first?.displayName ?? ""
                    return nameA.localizedCaseInsensitiveCompare(nameB) == .orderedAscending
                }

            return CompactedTreeNode(
                path: currentPath,
                children: compactedChildren,
                plants: node.plants,
                plantCount: node.plantCount,
                isBranchPoint: node.children.count > 1,
                isLeaf: node.children.isEmpty
            )
        }

        let compactedRoots = tree.roots
            .map { compactNode($0) }
            .sorted {
                let nameA = $0.path.first?.displayName ?? ""
                let nameB = $1.path.first?.displayName ?? ""
                return nameA.localizedCaseInsensitiveCompare(nameB) == .orderedAscending
            }

        return CompactedTaxonomyTree(
            roots: compactedRoots,
            totalPlants: tree.totalPlants,
            plantsWithoutTaxon: tree.plantsWithoutTaxon
        )
    }
}
