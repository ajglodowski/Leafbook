//
//  JournalEntryFormView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct JournalEntryFormView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var sessionState: SessionState

    let initialPlantId: String?
    let entryToEdit: JournalEntry?
    let onSave: @Sendable (String, String?, String, Date, String?, String?) async -> Bool
    let onDelete: (@Sendable (String) async -> Bool)?

    @State private var plants: [Plant] = []
    @State private var selectedPlantId: String = ""
    @State private var title = ""
    @State private var content = ""
    @State private var entryDate = Date()
    @State private var availableEvents: [PlantEvent] = []
    @State private var selectedEventId: String? = nil
    @State private var isSaving = false
    @State private var isDeleting = false
    @State private var errorMessage: String?
    @State private var showingDeleteConfirmation = false

    init(
        initialPlantId: String? = nil,
        entryToEdit: JournalEntry? = nil,
        onSave: @escaping @Sendable (String, String?, String, Date, String?, String?) async -> Bool,
        onDelete: (@Sendable (String) async -> Bool)? = nil
    ) {
        self.entryToEdit = entryToEdit
        self.initialPlantId = entryToEdit?.plantId ?? initialPlantId
        self.onSave = onSave
        self.onDelete = onDelete
        _selectedPlantId = State(initialValue: entryToEdit?.plantId ?? "")
        _title = State(initialValue: entryToEdit?.title ?? "")
        _content = State(initialValue: entryToEdit?.content ?? "")
        _entryDate = State(initialValue: Self.initialDate(from: entryToEdit?.entryDate))
        _selectedEventId = State(initialValue: entryToEdit?.eventId)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Plant")) {
                    Picker("Plant", selection: $selectedPlantId) {
                        ForEach(plants) { plant in
                            Text(plant.displayName).tag(plant.id)
                        }
                    }
                }

                Section(header: Text("Entry")) {
                    TextField("Title (optional)", text: $title)
                    DatePicker("Date", selection: $entryDate, displayedComponents: .date)
                    TextEditor(text: $content)
                        .frame(minHeight: 160)
                }

                if !availableEvents.isEmpty {
                    Section(header: Text("Link to event")) {
                        Picker("Event (optional)", selection: $selectedEventId) {
                            Text("No linked event").tag(String?.none)
                            ForEach(availableEvents) { event in
                                Text(eventLabel(for: event))
                                    .tag(Optional(event.id))
                            }
                        }
                    }
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(Color.red)
                }

                if entryToEdit != nil, onDelete != nil {
                    Section {
                        Button(role: .destructive) {
                            showingDeleteConfirmation = true
                        } label: {
                            Text(isDeleting ? "Deleting…" : "Delete entry")
                        }
                        .disabled(isDeleting || isSaving)
                    }
                }
            }
            .navigationTitle(entryToEdit == nil ? "New entry" : "Edit entry")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Saving…" : (entryToEdit == nil ? "Save" : "Update")) {
                        Task {
                            await saveEntry()
                        }
                    }
                    .disabled(isSaving || isDeleting || selectedPlantId.isEmpty || content.isEmpty)
                }
            }
            .alert("Delete entry?", isPresented: $showingDeleteConfirmation) {
                Button("Delete", role: .destructive) {
                    Task {
                        await deleteEntry()
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This action cannot be undone.")
            }
            .task {
                await loadPlants()
            }
            .onChange(of: selectedPlantId) { _, newValue in
                Task {
                    await loadEvents(for: newValue)
                }
            }
        }
    }

    private func loadPlants() async {
        guard case let .signedIn(userId) = sessionState.status else { return }
        do {
            plants = try await SupabaseService.shared.fetchActivePlants(userId: userId)
            if selectedPlantId.isEmpty {
                if let initialPlantId, plants.contains(where: { $0.id == initialPlantId }) {
                    selectedPlantId = initialPlantId
                } else {
                    selectedPlantId = plants.first?.id ?? ""
                }
            }
            if !selectedPlantId.isEmpty {
                await loadEvents(for: selectedPlantId)
            }
        } catch {
            errorMessage = "We couldn't load your plants."
        }
    }

    private func loadEvents(for plantId: String) async {
        guard case let .signedIn(userId) = sessionState.status else { return }
        guard !plantId.isEmpty else {
            availableEvents = []
            selectedEventId = nil
            return
        }

        do {
            availableEvents = try await SupabaseService.shared.fetchPlantEvents(plantId: plantId)
                .sorted { $0.eventDate > $1.eventDate }
            if let selectedEventId, availableEvents.contains(where: { $0.id == selectedEventId }) {
                return
            }
            selectedEventId = nil
        } catch {
            print("JournalEntryFormView: failed to load events for userId=\(userId), plantId=\(plantId): \(error)")
            availableEvents = []
            selectedEventId = nil
        }
    }

    private func saveEntry() async {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let result = await onSave(
            selectedPlantId,
            trimmedTitle.isEmpty ? nil : trimmedTitle,
            content.trimmingCharacters(in: .whitespacesAndNewlines),
            entryDate,
            selectedEventId,
            entryToEdit?.id
        )

        if result {
            dismiss()
        } else {
            errorMessage = "We couldn't save that entry."
        }
    }

    private func deleteEntry() async {
        guard let entryToEdit, let onDelete else { return }
        isDeleting = true
        errorMessage = nil
        defer { isDeleting = false }

        let result = await onDelete(entryToEdit.id)
        if result {
            dismiss()
        } else {
            errorMessage = "We couldn't delete that entry."
        }
    }

    private func eventLabel(for event: PlantEvent) -> String {
        let formattedDate = formattedDateLabel(from: event.eventDate)
        let title = event.eventType.replacingOccurrences(of: "_", with: " ").capitalized
        if let formattedDate {
            return "\(title) · \(formattedDate)"
        }
        return title
    }

    private func formattedDateLabel(from dateString: String) -> String? {
        let formatter = ISO8601DateFormatter()
        if let date = formatter.date(from: dateString) {
            return date.formatted(date: .abbreviated, time: .omitted)
        }
        return nil
    }

    private static func initialDate(from entryDate: String?) -> Date {
        guard let entryDate else { return Date() }
        let formatter = ISO8601DateFormatter()
        return formatter.date(from: entryDate) ?? Date()
    }
}

#Preview {
    JournalEntryFormView { _, _, _, _, _, _ in
        true
    }
    .environmentObject(SessionState(isPreview: true))
}
