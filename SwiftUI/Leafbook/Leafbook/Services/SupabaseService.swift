//
//  SupabaseService.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Foundation
import Supabase

final class SupabaseService: @unchecked Sendable {
    static let shared = SupabaseService()

    let client: SupabaseClient

    private enum ValidationError: LocalizedError {
        case invalidUUID(field: String, value: String)
        case selfReference

        var errorDescription: String? {
            switch self {
            case let .invalidUUID(field, value):
                return "Invalid UUID for \(field): \(value)"
            case .selfReference:
                return "A plant cannot be its own parent"
            }
        }
    }

    private struct PlantCarePreferencesUpsert: Encodable {
        let plant_id: String
        let watering_frequency_days: Int?
        let fertilizing_frequency_days: Int?
    }

    private struct PlantDetailsUpdate: Encodable {
        let name: String
        let nickname: String?
        let plant_location: String?
        let location: String?
        let light_exposure: String?
        let size_category: String?
        let how_acquired: String?
        let description: String?
        let acquired_at: String?
        let parent_plant_id: String?
    }

    private struct ParentPlantUpdate: Encodable {
        let parent_plant_id: String?
    }

    private struct PlantInsertPayload: Encodable {
        let user_id: String
        let name: String
        let nickname: String?
        let plant_type_id: String?
        let parent_plant_id: String?
        let plant_location: String
        let location: String?
        let light_exposure: String?
        let how_acquired: String?
        let acquired_at: String?
        let description: String?
    }

    private struct PlantCurrentPotUpdate: Encodable {
        let current_pot_id: String?
    }

    private struct PlantLegacyUpdate: Encodable {
        let is_legacy: Bool
        let legacy_reason: String?
        let legacy_at: String?
    }

    private struct PlantLocationUpdate: Encodable {
        let location: String?
    }

    private struct MoveEventMetadataPayload: Encodable {
        let from_location: String?
        let to_location: String?
    }

    private struct RepotEventMetadataPayload: Encodable {
        let from_pot_id: String?
        let to_pot_id: String?
    }

    private struct PropagationEventMetadataPayload: Encodable {
        let parent_plant_id: String?
    }

    private func validateUUID(_ value: String, field: String) throws {
        guard UUID(uuidString: value) != nil else {
            throw ValidationError.invalidUUID(field: field, value: value)
        }
    }

    private struct MoveEventPayload: Encodable {
        let plant_id: String
        let user_id: String
        let event_type: String
        let event_date: String
        let notes: String?
        let metadata: MoveEventMetadataPayload
    }

    private struct RepotEventPayload: Encodable {
        let plant_id: String
        let user_id: String
        let event_type: String
        let event_date: String
        let metadata: RepotEventMetadataPayload
    }

    private struct PropagationEventPayload: Encodable {
        let plant_id: String
        let user_id: String
        let event_type: String
        let event_date: String
        let notes: String?
        let metadata: PropagationEventMetadataPayload
    }

    private struct MoveEventUpdatePayload: Encodable {
        let event_date: String
        let notes: String?
        let metadata: MoveEventMetadataPayload
    }

    private struct CareEventUpdatePayload: Encodable {
        let event_date: String
        let notes: String?
    }

    private struct PropagationEventUpdatePayload: Encodable {
        let event_date: String
        let notes: String?
        let metadata: PropagationEventMetadataPayload
    }

    private struct RepotEventUpdatePayload: Encodable {
        let event_date: String
        let metadata: RepotEventMetadataPayload
    }

    private struct PlantPhotoUpdatePayload: Encodable {
        let taken_at: String
        let caption: String?
    }

    private struct CountRecord: Decodable {
        let id: String
    }

    private struct ParentPlantSnapshot: Decodable {
        let id: String
        let name: String
        let plantTypeId: String?

        enum CodingKeys: String, CodingKey {
            case id
            case name
            case plantTypeId = "plant_type_id"
        }
    }

    init() {
        client = SupabaseClient(
            supabaseURL: SupabaseConfiguration.supabaseURL,
            supabaseKey: SupabaseConfiguration.publishableKey,
            options: SupabaseClientOptions(
                auth: SupabaseClientOptions.AuthOptions(
                    storage: SharedAuthStorage(),
                    emitLocalSessionAsInitialSession: true
                )
            )
        )
    }

    func signIn(email: String, password: String) async throws {
        do {
            _ = try await client.auth.signIn(email: email, password: password)
        } catch {
            print("SupabaseService: signIn failed: \(error)")
            throw error
        }
    }

    func signOut() async throws {
        do {
            try await client.auth.signOut()
        } catch {
            print("SupabaseService: signOut failed: \(error)")
            throw error
        }
    }

    func fetchDashboardProfile(userId: String) async throws -> DashboardProfile? {
        do {
            let results: [DashboardProfile] = try await client
                .from("profiles")
                .select("id, display_name")
                .eq("id", value: userId)
                .limit(1)
                .execute()
                .value
            return results.first
        } catch {
            print("SupabaseService: fetchDashboardProfile failed for userId=\(userId): \(error)")
            throw error
        }
    }

    func fetchActivePlantCount(userId: String) async throws -> Int {
        do {
            let response: PostgrestResponse<[CountRecord]> = try await client
                .from("plants")
                .select("id", count: .exact)
                .eq("user_id", value: userId)
                .eq("is_active", value: true)
                .execute()
            let count = response.count ?? response.value.count
            return count
        } catch {
            print("SupabaseService: fetchActivePlantCount failed for userId=\(userId): \(error)")
            throw error
        }
    }

    func fetchWishlistCount(userId: String) async throws -> Int {
        do {
            let response: PostgrestResponse<[CountRecord]> = try await client
                .from("wishlist_items")
                .select("id", count: .exact)
                .eq("user_id", value: userId)
                .execute()
            let count = response.count ?? response.value.count
            return count
        } catch {
            print("SupabaseService: fetchWishlistCount failed for userId=\(userId): \(error)")
            throw error
        }
    }

    func fetchActiveIssueCount(userId: String) async throws -> Int {
        do {
            let response: PostgrestResponse<[CountRecord]> = try await client
                .from("plant_issues")
                .select("id", count: .exact)
                .eq("user_id", value: userId)
                .eq("status", value: IssueStatus.active.rawValue)
                .execute()
            let count = response.count ?? response.value.count
            return count
        } catch {
            print("SupabaseService: fetchActiveIssueCount failed for userId=\(userId): \(error)")
            throw error
        }
    }

    func fetchActivePlants(userId: String) async throws -> [Plant] {
        do {
            return try await client
                .from("plants")
                .select("""
                    id,
                    name,
                    nickname,
                    plant_location,
                    location,
                    is_active,
                    is_legacy,
                    legacy_reason,
                    legacy_at,
                    created_at,
                    plant_type_id,
                    active_photo_id,
                    plant_types (
                      id,
                      name,
                      scientific_name
                    )
                """)
                .eq("user_id", value: userId)
                .eq("is_active", value: true)
                .eq("is_legacy", value: false)
                .order("created_at", ascending: false)
                .execute()
                .value
        } catch {
            print("SupabaseService: fetchActivePlants failed for userId=\(userId): \(error)")
            throw error
        }
    }

    func fetchLegacyPlants(userId: String) async throws -> [Plant] {
        do {
            return try await client
                .from("plants")
                .select("""
                    id,
                    name,
                    nickname,
                    plant_location,
                    location,
                    is_active,
                    is_legacy,
                    legacy_reason,
                    legacy_at,
                    created_at,
                    plant_type_id,
                    active_photo_id,
                    plant_types (
                      id,
                      name,
                      scientific_name
                    )
                """)
                .eq("user_id", value: userId)
                .eq("is_legacy", value: true)
                .order("legacy_at", ascending: false)
                .execute()
                .value
        } catch {
            print("SupabaseService: fetchLegacyPlants failed for userId=\(userId): \(error)")
            throw error
        }
    }

    func fetchPlantDetail(plantId: String, userId: String) async throws -> Plant {
        do {
            try validateUUID(plantId, field: "plantId")
            try validateUUID(userId, field: "userId")

            return try await client
                .from("plants")
                .select("""
                    id,
                    name,
                    nickname,
                    plant_location,
                    location,
                    light_exposure,
                    size_category,
                    is_active,
                    is_legacy,
                    legacy_reason,
                    legacy_at,
                    created_at,
                    acquired_at,
                    how_acquired,
                    description,
                    plant_type_id,
                    active_photo_id,
                    current_pot_id,
                    parent_plant_id,
                    plant_types (
                      id,
                      name,
                      scientific_name,
                      watering_frequency_days,
                      fertilizing_frequency_days,
                      light_min,
                      light_max,
                      description
                    )
                """)
                .eq("id", value: plantId)
                .eq("user_id", value: userId)
                .single()
                .execute()
                .value
        } catch {
            print("SupabaseService: fetchPlantDetail failed for plantId=\(plantId), userId=\(userId): \(error)")
            throw error
        }
    }

    func fetchPlantPhotos(plantId: String) async throws -> [PlantPhoto] {
        do {
            return try await client
                .from("plant_photos")
                .select("id, plant_id, url, caption, taken_at")
                .eq("plant_id", value: plantId)
                .order("taken_at", ascending: false)
                .execute()
                .value
        } catch {
            print("SupabaseService: fetchPlantPhotos failed for plantId=\(plantId): \(error)")
            throw error
        }
    }

    func fetchPlantPhotos(photoIds: [String]) async throws -> [PlantPhoto] {
        guard !photoIds.isEmpty else { return [] }

        do {
            return try await client
                .from("plant_photos")
                .select("id, plant_id, url, caption, taken_at")
                .in("id", values: photoIds)
                .execute()
                .value
        } catch {
            print("SupabaseService: fetchPlantPhotos failed for photoIds=\(photoIds): \(error)")
            throw error
        }
    }

    func fetchPlantPhotos(plantIds: [String]) async throws -> [PlantPhoto] {
        guard !plantIds.isEmpty else { return [] }

        do {
            return try await client
                .from("plant_photos")
                .select("id, plant_id, url, caption, taken_at")
                .in("plant_id", values: plantIds)
                .order("taken_at", ascending: false)
                .execute()
                .value
        } catch {
            print("SupabaseService: fetchPlantPhotos failed for plantIds=\(plantIds): \(error)")
            throw error
        }
    }

    func fetchDueTasks(userId: String) async throws -> [PlantDueTask] {
        do {
            return try await client
                .from("v_plant_due_tasks")
                .select("""
                    plant_id,
                    plant_name,
                    plant_type_name,
                    watering_status,
                    watering_frequency_days,
                    last_watered_at,
                    water_due_at,
                    fertilizing_status,
                    fertilizing_frequency_days,
                    last_fertilized_at,
                    fertilize_due_at
                """)
                .eq("user_id", value: userId)
                .execute()
                .value
        } catch {
            print("SupabaseService: fetchDueTasks failed for userId=\(userId): \(error)")
            throw error
        }
    }

    func fetchPlantDueTask(plantId: String) async throws -> PlantDueTask? {
        do {
            let results: [PlantDueTask] = try await client
                .from("v_plant_due_tasks")
                .select("""
                    plant_id,
                    plant_name,
                    plant_type_name,
                    watering_status,
                    watering_frequency_days,
                    last_watered_at,
                    water_due_at,
                    fertilizing_status,
                    fertilizing_frequency_days,
                    last_fertilized_at,
                    fertilize_due_at
                """)
                .eq("plant_id", value: plantId)
                .limit(1)
                .execute()
                .value
            return results.first
        } catch {
            print("SupabaseService: fetchPlantDueTask failed for plantId=\(plantId): \(error)")
            throw error
        }
    }

    func fetchPlantEvents(plantId: String) async throws -> [PlantEvent] {
        do {
            return try await client
                .from("plant_events")
                .select("id, plant_id, event_type, event_date, notes, metadata")
                .eq("plant_id", value: plantId)
                .order("event_date", ascending: false)
                .limit(20)
                .execute()
                .value
        } catch {
            print("SupabaseService: fetchPlantEvents failed for plantId=\(plantId): \(error)")
            throw error
        }
    }

    func fetchLatestMoveEvent(plantId: String) async throws -> PlantEvent? {
        do {
            let results: [PlantEvent] = try await client
                .from("plant_events")
                .select("id, plant_id, event_type, event_date, notes, metadata")
                .eq("plant_id", value: plantId)
                .eq("event_type", value: TimelineEventType.moved.rawValue)
                .order("event_date", ascending: false)
                .limit(1)
                .execute()
                .value
            return results.first
        } catch {
            print("SupabaseService: fetchLatestMoveEvent failed for plantId=\(plantId): \(error)")
            throw error
        }
    }

    func fetchPlantIssues(plantId: String) async throws -> [PlantIssue] {
        do {
            return try await client
                .from("plant_issues")
                .select("id, plant_id, issue_type, severity, status, description, started_at, resolved_at, resolution_notes")
                .eq("plant_id", value: plantId)
                .order("started_at", ascending: false)
                .limit(20)
                .execute()
                .value
        } catch {
            print("SupabaseService: fetchPlantIssues failed for plantId=\(plantId): \(error)")
            throw error
        }
    }

    func fetchPlantCarePreferences(plantId: String) async throws -> PlantCarePreferences? {
        do {
            let results: [PlantCarePreferences] = try await client
                .from("plant_care_preferences")
                .select("plant_id, watering_frequency_days, fertilizing_frequency_days")
                .eq("plant_id", value: plantId)
                .limit(1)
                .execute()
                .value
            return results.first
        } catch {
            print("SupabaseService: fetchPlantCarePreferences failed for plantId=\(plantId): \(error)")
            throw error
        }
    }

    func fetchPlantScheduleSuggestion(plantId: String) async throws -> PlantScheduleSuggestion? {
        do {
            let results: [PlantScheduleSuggestion] = try await client
                .from("watering_schedule_suggestions")
                .select("*")
                .eq("plant_id", value: plantId)
                .is("dismissed_at", value: nil)
                .is("accepted_at", value: nil)
                .limit(1)
                .execute()
                .value
            return results.first
        } catch {
            print("SupabaseService: fetchPlantScheduleSuggestion failed for plantId=\(plantId): \(error)")
            throw error
        }
    }

    func fetchDashboardScheduleSuggestions(userId: String) async throws -> [DashboardScheduleSuggestion] {
        struct PlantNameRecord: Decodable {
            let name: String
        }

        struct ScheduleSuggestionRecord: Decodable {
            let id: String
            let plantId: String
            let suggestedIntervalDays: Int
            let currentIntervalDays: Int
            let confidenceScore: Double?
            let plants: [PlantNameRecord]?

            enum CodingKeys: String, CodingKey {
                case id
                case plantId = "plant_id"
                case suggestedIntervalDays = "suggested_interval_days"
                case currentIntervalDays = "current_interval_days"
                case confidenceScore = "confidence_score"
                case plants
            }
        }

        do {
            let records: [ScheduleSuggestionRecord] = try await client
                .from("watering_schedule_suggestions")
                .select("""
                    id,
                    plant_id,
                    suggested_interval_days,
                    current_interval_days,
                    confidence_score,
                    plants!inner (name)
                """)
                .eq("user_id", value: userId)
                .is("dismissed_at", value: nil)
                .is("accepted_at", value: nil)
                .order("detected_at", ascending: false)
                .limit(5)
                .execute()
                .value

            return records.map { record in
            let plantName = record.plants?.first?.name ?? "Unknown"
                return DashboardScheduleSuggestion(
                    id: record.id,
                    plantId: record.plantId,
                    plantName: plantName,
                    suggestedIntervalDays: record.suggestedIntervalDays,
                    currentIntervalDays: record.currentIntervalDays,
                    confidenceScore: record.confidenceScore
                )
            }
        } catch {
            print("SupabaseService: fetchDashboardScheduleSuggestions failed for userId=\(userId): \(error)")
            throw error
        }
    }

    func fetchDashboardSpotlightPlants(userId: String) async throws -> [DashboardSpotlightPlant] {
        struct PlantTypeRecord: Decodable {
            let name: String?
        }

        struct PlantPhotoRecord: Decodable {
            let url: String
        }

        struct SpotlightPlantRecord: Decodable {
            let id: String
            let name: String
            let nickname: String?
            let description: String?
            let howAcquired: String?
            let plantTypes: PlantTypeRecord?
            let plantPhotos: [PlantPhotoRecord]?

            enum CodingKeys: String, CodingKey {
                case id
                case name
                case nickname
                case description
                case howAcquired = "how_acquired"
                case plantTypes = "plant_types"
                case plantPhotos = "plant_photos"
            }
        }

        do {
            let records: [SpotlightPlantRecord] = try await client
                .from("plants")
                .select("""
                    id,
                    name,
                    nickname,
                    description,
                    how_acquired,
                    plant_types (name),
                    plant_photos!plant_photos_plant_id_fkey (url)
                """)
                .eq("user_id", value: userId)
                .eq("is_active", value: true)
                .limit(10)
                .execute()
                .value

            return records.map { record in
                DashboardSpotlightPlant(
                    id: record.id,
                    name: record.name,
                    nickname: record.nickname,
                    description: record.description,
                    howAcquired: record.howAcquired,
                    plantTypeName: record.plantTypes?.name,
                    photoUrl: record.plantPhotos?.first?.url
                )
            }
        } catch {
            print("SupabaseService: fetchDashboardSpotlightPlants failed for userId=\(userId): \(error)")
            throw error
        }
    }

    func fetchUserPotsWithUsage(userId: String) async throws -> (pots: [PlantPot], activePlants: [(id: String, name: String, currentPotId: String?)]) {
        do {
            let pots: [PlantPot] = try await client
                .from("user_pots")
                .select("id, name, size_inches, material, photo_url, is_retired, has_drainage, color")
                .eq("user_id", value: userId)
                .order("is_retired", ascending: true)
                .order("size_inches", ascending: true)
                .order("created_at", ascending: false)
                .execute()
                .value

            struct ActivePlant: Decodable {
                let id: String
                let name: String
                let currentPotId: String?

                enum CodingKeys: String, CodingKey {
                    case id
                    case name
                    case currentPotId = "current_pot_id"
                }
            }

            let activePlants: [ActivePlant] = try await client
                .from("plants")
                .select("id, name, current_pot_id")
                .eq("user_id", value: userId)
                .eq("is_active", value: true)
                .not("current_pot_id", operator: .is, value: Optional<String>.none)
                .execute()
                .value

            return (pots, activePlants.map { ($0.id, $0.name, $0.currentPotId) })
        } catch {
            print("SupabaseService: fetchUserPotsWithUsage failed for userId=\(userId): \(error)")
            throw error
        }
    }

    func fetchParentPlant(parentPlantId: String, userId: String) async throws -> PropagationPlant? {
        do {
            return try await client
                .from("plants")
                .select("id, name, nickname, active_photo_id, is_legacy")
                .eq("id", value: parentPlantId)
                .eq("user_id", value: userId)
                .single()
                .execute()
                .value
        } catch {
            print("SupabaseService: fetchParentPlant failed for parentPlantId=\(parentPlantId), userId=\(userId): \(error)")
            throw error
        }
    }

    func fetchChildrenPlants(plantId: String, userId: String) async throws -> [PropagationPlant] {
        do {
            return try await client
                .from("plants")
                .select("id, name, nickname, active_photo_id, is_legacy, created_at")
                .eq("user_id", value: userId)
                .eq("parent_plant_id", value: plantId)
                .order("created_at", ascending: false)
                .execute()
                .value
        } catch {
            print("SupabaseService: fetchChildrenPlants failed for plantId=\(plantId), userId=\(userId): \(error)")
            throw error
        }
    }

    func fetchPlantsForParentSelection(userId: String, currentPlantId: String) async throws -> [PropagationPlant] {
        do {
            return try await client
                .from("plants")
                .select("id, name, nickname, active_photo_id, is_legacy, created_at")
                .eq("user_id", value: userId)
                .eq("is_active", value: true)
                .neq("id", value: currentPlantId)
                .order("created_at", ascending: false)
                .execute()
                .value
        } catch {
            print("SupabaseService: fetchPlantsForParentSelection failed for userId=\(userId), currentPlantId=\(currentPlantId): \(error)")
            throw error
        }
    }

    func createCareEvent(userId: String, plantId: String, eventType: TimelineEventType, eventDate: Date = Date()) async throws {
        do {
            try await client
                .from("plant_events")
                .insert([
                    "plant_id": plantId,
                    "user_id": userId,
                    "event_type": eventType.rawValue,
                    "event_date": ISO8601DateFormatter().string(from: eventDate),
                ])
                .execute()
        } catch {
            print("SupabaseService: createCareEvent failed for userId=\(userId), plantId=\(plantId), eventType=\(eventType): \(error)")
            throw error
        }
    }

    func createMoveEvent(
        userId: String,
        plantId: String,
        eventDate: Date,
        fromLocation: String?,
        toLocation: String,
        notes: String?
    ) async throws {
        do {
            let metadata = MoveEventMetadataPayload(
                from_location: fromLocation,
                to_location: toLocation
            )
            let payload = MoveEventPayload(
                plant_id: plantId,
                user_id: userId,
                event_type: TimelineEventType.moved.rawValue,
                event_date: ISO8601DateFormatter().string(from: eventDate),
                notes: notes,
                metadata: metadata
            )
            try await client
                .from("plant_events")
                .insert(payload)
                .execute()
        } catch {
            print("SupabaseService: createMoveEvent failed for userId=\(userId), plantId=\(plantId): \(error)")
            throw error
        }
    }

    func createRepotEvent(
        userId: String,
        plantId: String,
        eventDate: Date,
        fromPotId: String?,
        toPotId: String?
    ) async throws {
        do {
            let metadata = RepotEventMetadataPayload(
                from_pot_id: fromPotId,
                to_pot_id: toPotId
            )
            let payload = RepotEventPayload(
                plant_id: plantId,
                user_id: userId,
                event_type: TimelineEventType.repotted.rawValue,
                event_date: ISO8601DateFormatter().string(from: eventDate),
                metadata: metadata
            )
            try await client
                .from("plant_events")
                .insert(payload)
                .execute()
        } catch {
            print("SupabaseService: createRepotEvent failed for userId=\(userId), plantId=\(plantId): \(error)")
            throw error
        }
    }

    func updateMoveEvent(
        eventId: String,
        eventDate: Date,
        fromLocation: String?,
        toLocation: String,
        notes: String?
    ) async throws {
        do {
            let metadata = MoveEventMetadataPayload(
                from_location: fromLocation,
                to_location: toLocation
            )
            let payload = MoveEventUpdatePayload(
                event_date: ISO8601DateFormatter().string(from: eventDate),
                notes: notes,
                metadata: metadata
            )
            try await client
                .from("plant_events")
                .update(payload)
                .eq("id", value: eventId)
                .execute()
        } catch {
            print("SupabaseService: updateMoveEvent failed for eventId=\(eventId): \(error)")
            throw error
        }
    }

    func updateCareEvent(eventId: String, eventDate: Date, notes: String?) async throws {
        do {
            let payload = CareEventUpdatePayload(
                event_date: ISO8601DateFormatter().string(from: eventDate),
                notes: notes
            )
            try await client
                .from("plant_events")
                .update(payload)
                .eq("id", value: eventId)
                .execute()
        } catch {
            print("SupabaseService: updateCareEvent failed for eventId=\(eventId): \(error)")
            throw error
        }
    }

    func updatePropagationEvent(
        eventId: String,
        eventDate: Date,
        notes: String?,
        parentPlantId: String?
    ) async throws {
        do {
            let metadata = PropagationEventMetadataPayload(parent_plant_id: parentPlantId)
            let payload = PropagationEventUpdatePayload(
                event_date: ISO8601DateFormatter().string(from: eventDate),
                notes: notes,
                metadata: metadata
            )
            try await client
                .from("plant_events")
                .update(payload)
                .eq("id", value: eventId)
                .execute()
        } catch {
            print("SupabaseService: updatePropagationEvent failed for eventId=\(eventId): \(error)")
            throw error
        }
    }

    func updateRepotEvent(
        eventId: String,
        eventDate: Date,
        fromPotId: String?,
        toPotId: String?
    ) async throws {
        do {
            let metadata = RepotEventMetadataPayload(
                from_pot_id: fromPotId,
                to_pot_id: toPotId
            )
            let payload = RepotEventUpdatePayload(
                event_date: ISO8601DateFormatter().string(from: eventDate),
                metadata: metadata
            )
            try await client
                .from("plant_events")
                .update(payload)
                .eq("id", value: eventId)
                .execute()
        } catch {
            print("SupabaseService: updateRepotEvent failed for eventId=\(eventId): \(error)")
            throw error
        }
    }

    func deletePlantEvent(eventId: String) async throws {
        do {
            try await client
                .from("plant_events")
                .delete()
                .eq("id", value: eventId)
                .execute()
        } catch {
            print("SupabaseService: deletePlantEvent failed for eventId=\(eventId): \(error)")
            throw error
        }
    }

    func createPlantIssue(userId: String, plantId: String, issueType: IssueType, severity: IssueSeverity, description: String) async throws {
        do {
            try await client
                .from("plant_issues")
                .insert([
                    "plant_id": plantId,
                    "user_id": userId,
                    "issue_type": issueType.rawValue,
                    "severity": severity.rawValue,
                    "status": IssueStatus.active.rawValue,
                    "description": description,
                    "started_at": ISO8601DateFormatter().string(from: Date()),
                ])
                .execute()
        } catch {
            print("SupabaseService: createPlantIssue failed for userId=\(userId), plantId=\(plantId), issueType=\(issueType): \(error)")
            throw error
        }
    }

    func updatePlantPhotoMetadata(photoId: String, takenAt: Date, caption: String?) async throws {
        do {
            let payload = PlantPhotoUpdatePayload(
                taken_at: ISO8601DateFormatter().string(from: takenAt),
                caption: caption
            )
            try await client
                .from("plant_photos")
                .update(payload)
                .eq("id", value: photoId)
                .execute()
        } catch {
            print("SupabaseService: updatePlantPhotoMetadata failed for photoId=\(photoId): \(error)")
            throw error
        }
    }

    func uploadPlantPhoto(plantId: String, imageData: Data, takenAt: Date?, caption: String?) async throws -> PlantPhoto {
        do {
            // Get auth token
            let session = try await client.auth.session
            let token = session.accessToken

            // Get API base URL
            guard let apiURL = URL(string: SupabaseConfiguration.apiBaseURL) else {
                throw NSError(domain: "SupabaseService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid API base URL"])
            }

            // Build upload URL
            let uploadURL = apiURL.appendingPathComponent("api/mobile/plant-photos/upload")

            // Create multipart form data
            let boundary = "Boundary-\(UUID().uuidString)"
            var request = URLRequest(url: uploadURL)
            request.httpMethod = "POST"
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

            var body = Data()

            // Add image file
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"file\"; filename=\"photo.jpg\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
            body.append(imageData)
            body.append("\r\n".data(using: .utf8)!)

            // Add plantId
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"plantId\"\r\n\r\n".data(using: .utf8)!)
            body.append(plantId.data(using: .utf8)!)
            body.append("\r\n".data(using: .utf8)!)

            // Add takenAt if provided
            if let takenAt {
                let isoDate = ISO8601DateFormatter().string(from: takenAt)
                body.append("--\(boundary)\r\n".data(using: .utf8)!)
                body.append("Content-Disposition: form-data; name=\"takenAt\"\r\n\r\n".data(using: .utf8)!)
                body.append(isoDate.data(using: .utf8)!)
                body.append("\r\n".data(using: .utf8)!)
            }

            // Add caption if provided
            if let caption, !caption.isEmpty {
                body.append("--\(boundary)\r\n".data(using: .utf8)!)
                body.append("Content-Disposition: form-data; name=\"caption\"\r\n\r\n".data(using: .utf8)!)
                body.append(caption.data(using: .utf8)!)
                body.append("\r\n".data(using: .utf8)!)
            }

            // Close multipart
            body.append("--\(boundary)--\r\n".data(using: .utf8)!)

            request.httpBody = body

            // Execute request
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw NSError(domain: "SupabaseService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
            }

            guard (200...299).contains(httpResponse.statusCode) else {
                let errorMessage = String(data: data, encoding: .utf8) ?? "Upload failed"
                throw NSError(domain: "SupabaseService", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: errorMessage])
            }

            // Decode response
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            let photo = try decoder.decode(PlantPhoto.self, from: data)

            return photo
        } catch {
            print("SupabaseService: uploadPlantPhoto failed for plantId=\(plantId): \(error)")
            throw error
        }
    }

    func updatePlantCarePreferences(plantId: String, wateringDays: Int?, fertilizingDays: Int?) async throws {
        do {
            let payload = PlantCarePreferencesUpsert(
                plant_id: plantId,
                watering_frequency_days: wateringDays,
                fertilizing_frequency_days: fertilizingDays
            )
            try await client
                .from("plant_care_preferences")
                .upsert(payload)
                .execute()
        } catch {
            print("SupabaseService: updatePlantCarePreferences failed for plantId=\(plantId): \(error)")
            throw error
        }
    }

    func updatePlantDetails(
        plantId: String,
        name: String,
        nickname: String?,
        plantLocation: PlantLocation?,
        location: String?,
        lightExposure: LightRequirement?,
        sizeCategory: SizeCategory?,
        howAcquired: String?,
        description: String?,
        acquiredAt: Date?,
        parentPlantId: String?
    ) async throws {
        do {
            let payload = PlantDetailsUpdate(
                name: name,
                nickname: nickname,
                plant_location: plantLocation?.rawValue,
                location: location,
                light_exposure: lightExposure?.rawValue,
                size_category: sizeCategory?.rawValue,
                how_acquired: howAcquired,
                description: description,
                acquired_at: acquiredAt.map { ISO8601DateFormatter().string(from: $0) },
                parent_plant_id: parentPlantId
            )

            try await client
                .from("plants")
                .update(payload)
                .eq("id", value: plantId)
                .execute()
        } catch {
            print("SupabaseService: updatePlantDetails failed for plantId=\(plantId): \(error)")
            throw error
        }
    }

    func setParentPlant(
        childPlantId: String,
        parentPlantId: String,
        userId: String,
        propagationDate: Date?
    ) async throws {
        do {
            if childPlantId == parentPlantId {
                throw ValidationError.selfReference
            }
            try validateUUID(childPlantId, field: "childPlantId")
            try validateUUID(parentPlantId, field: "parentPlantId")
            try validateUUID(userId, field: "userId")

            let payload = ParentPlantUpdate(parent_plant_id: parentPlantId)
            try await client
                .from("plants")
                .update(payload)
                .eq("id", value: childPlantId)
                .eq("user_id", value: userId)
                .execute()

            let eventDate = ISO8601DateFormatter().string(from: propagationDate ?? Date())
            do {
                let payload = PropagationEventPayload(
                    plant_id: childPlantId,
                    user_id: userId,
                    event_type: TimelineEventType.propagated.rawValue,
                    event_date: eventDate,
                    notes: "Propagated from parent plant",
                    metadata: PropagationEventMetadataPayload(parent_plant_id: parentPlantId)
                )
                try await client
                    .from("plant_events")
                    .insert(payload)
                    .execute()
            } catch {
                print("SupabaseService: setParentPlant event log failed for childPlantId=\(childPlantId): \(error)")
            }
        } catch {
            print("SupabaseService: setParentPlant failed for childPlantId=\(childPlantId), parentPlantId=\(parentPlantId): \(error)")
            throw error
        }
    }

    func clearParentPlant(childPlantId: String, userId: String) async throws {
        do {
            try validateUUID(childPlantId, field: "childPlantId")
            try validateUUID(userId, field: "userId")

            let payload = ParentPlantUpdate(parent_plant_id: nil)
            try await client
                .from("plants")
                .update(payload)
                .eq("id", value: childPlantId)
                .eq("user_id", value: userId)
                .execute()
        } catch {
            print("SupabaseService: clearParentPlant failed for childPlantId=\(childPlantId): \(error)")
            throw error
        }
    }

    func createPropagatedPlant(
        userId: String,
        parentPlantId: String,
        name: String,
        nickname: String?,
        plantTypeId: String?,
        plantLocation: PlantLocation,
        location: String?,
        lightExposure: LightRequirement?,
        propagationDate: Date?,
        description: String?
    ) async throws -> Plant {
        do {
            try validateUUID(userId, field: "userId")
            try validateUUID(parentPlantId, field: "parentPlantId")

            let parent: ParentPlantSnapshot = try await client
                .from("plants")
                .select("id, name, plant_type_id")
                .eq("id", value: parentPlantId)
                .eq("user_id", value: userId)
                .single()
                .execute()
                .value

            let resolvedPlantTypeId = plantTypeId ?? parent.plantTypeId
            let eventDate = propagationDate ?? Date()
            let payload = PlantInsertPayload(
                user_id: userId,
                name: name,
                nickname: nickname,
                plant_type_id: resolvedPlantTypeId,
                parent_plant_id: parentPlantId,
                plant_location: plantLocation.rawValue,
                location: location,
                light_exposure: lightExposure?.rawValue,
                how_acquired: "Propagated from \(parent.name)",
                acquired_at: ISO8601DateFormatter().string(from: eventDate),
                description: description
            )

            let plant: Plant = try await client
                .from("plants")
                .insert(payload)
                .select("""
                    id,
                    name,
                    nickname,
                    plant_location,
                    location,
                    light_exposure,
                    size_category,
                    is_active,
                    is_legacy,
                    legacy_reason,
                    legacy_at,
                    created_at,
                    acquired_at,
                    how_acquired,
                    description,
                    plant_type_id,
                    active_photo_id,
                    current_pot_id,
                    parent_plant_id
                """)
                .single()
                .execute()
                .value

            do {
                let eventPayload = PropagationEventPayload(
                    plant_id: plant.id,
                    user_id: userId,
                    event_type: TimelineEventType.propagated.rawValue,
                    event_date: ISO8601DateFormatter().string(from: eventDate),
                    notes: "Propagated from \(parent.name)",
                    metadata: PropagationEventMetadataPayload(parent_plant_id: parentPlantId)
                )
                try await client
                    .from("plant_events")
                    .insert(eventPayload)
                    .execute()
            } catch {
                print("SupabaseService: createPropagatedPlant event log failed for plantId=\(plant.id): \(error)")
            }

            return plant
        } catch {
            print("SupabaseService: createPropagatedPlant failed for parentPlantId=\(parentPlantId), userId=\(userId): \(error)")
            throw error
        }
    }

    func createAcquiredEvent(userId: String, plantId: String) async throws {
        do {
            try await client
                .from("plant_events")
                .insert([
                    "plant_id": plantId,
                    "user_id": userId,
                    "event_type": TimelineEventType.acquired.rawValue,
                    "event_date": ISO8601DateFormatter().string(from: Date())
                ])
                .execute()
        } catch {
            print("SupabaseService: createAcquiredEvent failed for plantId=\(plantId): \(error)")
            throw error
        }
    }

    func updatePlantCurrentPot(plantId: String, potId: String?) async throws {
        do {
            let payload = PlantCurrentPotUpdate(current_pot_id: potId)
            try await client
                .from("plants")
                .update(payload)
                .eq("id", value: plantId)
                .execute()
        } catch {
            print("SupabaseService: updatePlantCurrentPot failed for plantId=\(plantId), potId=\(potId ?? "nil"): \(error)")
            throw error
        }
    }

    func updatePlantLocation(plantId: String, location: String?) async throws {
        do {
            let payload = PlantLocationUpdate(location: location)
            try await client
                .from("plants")
                .update(payload)
                .eq("id", value: plantId)
                .execute()
        } catch {
            print("SupabaseService: updatePlantLocation failed for plantId=\(plantId): \(error)")
            throw error
        }
    }

    func acceptScheduleSuggestion(suggestionId: String) async throws {
        do {
            try await client
                .from("watering_schedule_suggestions")
                .update(["accepted_at": ISO8601DateFormatter().string(from: Date())])
                .eq("id", value: suggestionId)
                .execute()
        } catch {
            print("SupabaseService: acceptScheduleSuggestion failed for suggestionId=\(suggestionId): \(error)")
            throw error
        }
    }

    func dismissScheduleSuggestion(suggestionId: String) async throws {
        do {
            try await client
                .from("watering_schedule_suggestions")
                .update(["dismissed_at": ISO8601DateFormatter().string(from: Date())])
                .eq("id", value: suggestionId)
                .execute()
        } catch {
            print("SupabaseService: dismissScheduleSuggestion failed for suggestionId=\(suggestionId): \(error)")
            throw error
        }
    }

    private struct TimelineEventRecord: Decodable {
        let id: String
        let plantId: String?
        let eventType: TimelineEventType
        let eventDate: String
        let notes: String?
        let metadata: PlantEventMetadata?
        let plants: PlantSummary?

        enum CodingKeys: String, CodingKey {
            case id
            case plantId = "plant_id"
            case eventType = "event_type"
            case eventDate = "event_date"
            case notes
            case metadata
            case plants
        }
    }

    func fetchTimelineEvents(userId: String) async throws -> [PlantEvent] {
        do {
            let records: [TimelineEventRecord] = try await client
                .from("plant_events")
                .select("""
                    id,
                    plant_id,
                    event_type,
                    event_date,
                    notes,
                    metadata,
                    plants!inner (
                        id,
                        name,
                        plant_type_id,
                        plant_types (
                            id,
                            name
                        )
                    )
                """)
                .eq("user_id", value: userId)
                .order("event_date", ascending: false)
                .execute()
                .value

            return records.map { record in
                PlantEvent(
                    id: record.id,
                    plantId: record.plantId,
                    eventType: record.eventType,
                    eventDate: record.eventDate,
                    notes: record.notes,
                    metadata: record.metadata,
                    plant: record.plants
                )
            }
        } catch {
            print("SupabaseService: fetchTimelineEvents failed for userId=\(userId): \(error)")
            throw error
        }
    }

    private struct TimelineIssueRecord: Decodable {
        let id: String
        let plantId: String?
        let issueType: IssueType
        let severity: IssueSeverity?
        let status: IssueStatus
        let description: String?
        let startedAt: String?
        let resolvedAt: String?
        let resolutionNotes: String?
        let plants: PlantSummary?

        enum CodingKeys: String, CodingKey {
            case id
            case plantId = "plant_id"
            case issueType = "issue_type"
            case severity
            case status
            case description
            case startedAt = "started_at"
            case resolvedAt = "resolved_at"
            case resolutionNotes = "resolution_notes"
            case plants
        }
    }

    func fetchTimelineIssues(userId: String) async throws -> [PlantIssue] {
        do {
            let records: [TimelineIssueRecord] = try await client
                .from("plant_issues")
                .select("""
                    id,
                    plant_id,
                    issue_type,
                    severity,
                    status,
                    description,
                    started_at,
                    resolved_at,
                    resolution_notes,
                    plants!inner (
                        id,
                        name,
                        plant_type_id,
                        plant_types (
                            id,
                            name
                        )
                    )
                """)
                .eq("user_id", value: userId)
                .order("started_at", ascending: false)
                .execute()
                .value

            return records.map { record in
                PlantIssue(
                    id: record.id,
                    plantId: record.plantId,
                    issueType: record.issueType,
                    severity: record.severity,
                    status: record.status,
                    description: record.description,
                    startedAt: record.startedAt,
                    resolvedAt: record.resolvedAt,
                    resolutionNotes: record.resolutionNotes,
                    plant: record.plants
                )
            }
        } catch {
            print("SupabaseService: fetchTimelineIssues failed for userId=\(userId): \(error)")
            throw error
        }
    }

    private struct JournalEntryRecord: Decodable {
        let id: String
        let title: String?
        let content: String
        let entryDate: String
        let createdAt: String
        let eventId: String?
        let plantId: String
        let plants: PlantSummary?

        enum CodingKeys: String, CodingKey {
            case id
            case title
            case content
            case entryDate = "entry_date"
            case createdAt = "created_at"
            case eventId = "event_id"
            case plantId = "plant_id"
            case plants
        }
    }

    func fetchJournalEntries(userId: String, plantId: String? = nil, limit: Int? = nil) async throws -> [JournalEntry] {
        let query = client
            .from("journal_entries")
            .select("""
                id,
                title,
                content,
                entry_date,
                created_at,
                event_id,
                plant_id,
                plants!inner (
                    id,
                    name,
                    plant_type_id,
                    plant_types (
                        id,
                        name
                    )
                )
            """)
            .eq("user_id", value: userId)

        if let plantId {
            query.eq("plant_id", value: plantId)
        }

        query.order("entry_date", ascending: false)

        if let limit {
            query.limit(limit)
        }

        do {
            let records: [JournalEntryRecord] = try await query.execute().value

            return records.map { record in
            let plant = record.plants ?? PlantSummary(
                id: record.plantId,
                name: "Unknown Plant",
                plantTypeId: nil,
                plantTypes: nil
            )

                return JournalEntry(
                    id: record.id,
                    title: record.title,
                    content: record.content,
                    entryDate: record.entryDate,
                    createdAt: record.createdAt,
                    eventId: record.eventId,
                    plantId: record.plantId,
                    plant: plant
                )
            }
        } catch {
            print("SupabaseService: fetchJournalEntries failed for userId=\(userId), plantId=\(plantId?.description ?? "nil"): \(error)")
            throw error
        }
    }

    private struct JournalEntryInsert: Encodable {
        let userId: String
        let plantId: String
        let title: String?
        let content: String
        let entryDate: String
        let eventId: String?

        enum CodingKeys: String, CodingKey {
            case userId = "user_id"
            case plantId = "plant_id"
            case title
            case content
            case entryDate = "entry_date"
            case eventId = "event_id"
        }
    }

    private struct JournalEntryUpdate: Encodable {
        let plantId: String
        let title: String?
        let content: String
        let entryDate: String
        let eventId: String?

        enum CodingKeys: String, CodingKey {
            case plantId = "plant_id"
            case title
            case content
            case entryDate = "entry_date"
            case eventId = "event_id"
        }
    }

    func createJournalEntry(
        userId: String,
        plantId: String,
        title: String?,
        content: String,
        entryDate: Date,
        eventId: String?
    ) async throws {
        let payload = JournalEntryInsert(
            userId: userId,
            plantId: plantId,
            title: title,
            content: content,
            entryDate: ISO8601DateFormatter().string(from: entryDate),
            eventId: eventId
        )

        do {
            try await client
                .from("journal_entries")
                .insert(payload)
                .execute()
        } catch {
            print("SupabaseService: createJournalEntry failed for userId=\(userId), plantId=\(plantId): \(error)")
            throw error
        }
    }

    func updateJournalEntry(
        entryId: String,
        userId: String,
        plantId: String,
        title: String?,
        content: String,
        entryDate: Date,
        eventId: String?
    ) async throws {
        let payload = JournalEntryUpdate(
            plantId: plantId,
            title: title,
            content: content,
            entryDate: ISO8601DateFormatter().string(from: entryDate),
            eventId: eventId
        )

        do {
            try await client
                .from("journal_entries")
                .update(payload)
                .eq("id", value: entryId)
                .eq("user_id", value: userId)
                .execute()
        } catch {
            print("SupabaseService: updateJournalEntry failed for entryId=\(entryId), userId=\(userId): \(error)")
            throw error
        }
    }

    func deleteJournalEntry(entryId: String, userId: String) async throws {
        do {
            try await client
                .from("journal_entries")
                .delete()
                .eq("id", value: entryId)
                .eq("user_id", value: userId)
                .execute()
        } catch {
            print("SupabaseService: deleteJournalEntry failed for entryId=\(entryId), userId=\(userId): \(error)")
            throw error
        }
    }

    func markPlantAsLegacy(plantId: String, userId: String, reason: String) async throws {
        do {
            try validateUUID(plantId, field: "plantId")
            try validateUUID(userId, field: "userId")

            let payload = PlantLegacyUpdate(
                is_legacy: true,
                legacy_reason: reason,
                legacy_at: ISO8601DateFormatter().string(from: Date())
            )
            try await client
                .from("plants")
                .update(payload)
                .eq("id", value: plantId)
                .eq("user_id", value: userId)
                .execute()

            try await client
                .from("plant_events")
                .insert([
                    "plant_id": plantId,
                    "user_id": userId,
                    "event_type": TimelineEventType.legacy.rawValue,
                    "event_date": ISO8601DateFormatter().string(from: Date()),
                    "notes": reason,
                ])
                .execute()
        } catch {
            print("SupabaseService: markPlantAsLegacy failed for plantId=\(plantId), userId=\(userId): \(error)")
            throw error
        }
    }

    func restorePlantFromLegacy(plantId: String, userId: String) async throws {
        do {
            try validateUUID(plantId, field: "plantId")
            try validateUUID(userId, field: "userId")

            let payload = PlantLegacyUpdate(
                is_legacy: false,
                legacy_reason: nil,
                legacy_at: nil
            )
            try await client
                .from("plants")
                .update(payload)
                .eq("id", value: plantId)
                .eq("user_id", value: userId)
                .execute()

            try await client
                .from("plant_events")
                .insert([
                    "plant_id": plantId,
                    "user_id": userId,
                    "event_type": TimelineEventType.restored.rawValue,
                    "event_date": ISO8601DateFormatter().string(from: Date()),
                    "notes": "Restored from legacy",
                ])
                .execute()
        } catch {
            print("SupabaseService: restorePlantFromLegacy failed for plantId=\(plantId), userId=\(userId): \(error)")
            throw error
        }
    }

    func createLegacyEvent(userId: String, plantId: String, reason: String?) async throws {
        do {
            try validateUUID(plantId, field: "plantId")
            try validateUUID(userId, field: "userId")

            try await client
                .from("plant_events")
                .insert([
                    "plant_id": plantId,
                    "user_id": userId,
                    "event_type": TimelineEventType.legacy.rawValue,
                    "event_date": ISO8601DateFormatter().string(from: Date()),
                    "notes": reason ?? "",
                ])
                .execute()
        } catch {
            print("SupabaseService: createLegacyEvent failed for plantId=\(plantId), userId=\(userId): \(error)")
            throw error
        }
    }
}

extension SupabaseService: SupabaseServicing {}
