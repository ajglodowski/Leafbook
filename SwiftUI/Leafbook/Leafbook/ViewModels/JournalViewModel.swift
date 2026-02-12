//
//  JournalViewModel.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Foundation
import Observation

@Observable
@MainActor
final class JournalViewModel {
    private(set) var entries: [JournalEntry] = []
    private(set) var isLoading = false
    var errorMessage: String?

    private let service: SupabaseService

    init(service: SupabaseService = .shared) {
        self.service = service
    }

    func load(userId: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            entries = try await service.fetchJournalEntries(userId: userId)
        } catch {
            errorMessage = "We couldn't load your journal yet."
        }
    }

    func createEntry(
        userId: String,
        plantId: String,
        title: String?,
        content: String,
        entryDate: Date,
        eventId: String?
    ) async -> Bool {
        do {
            try await service.createJournalEntry(
                userId: userId,
                plantId: plantId,
                title: title,
                content: content,
                entryDate: entryDate,
                eventId: eventId
            )
            await load(userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't save that entry."
            return false
        }
    }

    func updateEntry(
        entryId: String,
        userId: String,
        plantId: String,
        title: String?,
        content: String,
        entryDate: Date,
        eventId: String?
    ) async -> Bool {
        do {
            try await service.updateJournalEntry(
                entryId: entryId,
                userId: userId,
                plantId: plantId,
                title: title,
                content: content,
                entryDate: entryDate,
                eventId: eventId
            )
            await load(userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't update that entry."
            return false
        }
    }

    func deleteEntry(entryId: String, userId: String) async -> Bool {
        do {
            try await service.deleteJournalEntry(entryId: entryId, userId: userId)
            await load(userId: userId)
            return true
        } catch {
            errorMessage = "We couldn't delete that entry."
            return false
        }
    }
}
