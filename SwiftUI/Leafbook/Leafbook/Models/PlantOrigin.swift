import Foundation

enum PlantOrigin: String, CaseIterable, Identifiable {
    case acquired
    case propagated

    var id: String { rawValue }

    var label: String {
        switch self {
        case .acquired:
            return "Acquired"
        case .propagated:
            return "Propagated"
        }
    }

    static func infer(from plant: Plant) -> PlantOrigin {
        plant.parentPlantId == nil ? .acquired : .propagated
    }
}
