//
//  PropagationEventFormView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/1/26.
//

import SwiftUI

struct ParentPlantOption: Identifiable, Equatable {
    let id: String
    let title: String
    let subtitle: String?
}

struct PropagationEventFormView: View {
    @Environment(\.dismiss) private var dismiss

    let title: String
    let parentOptions: [ParentPlantOption]
    let onSave: @Sendable (Date, String?, String?) async -> Bool
    let onDelete: (@Sendable () async -> Bool)?

    @State private var eventDate: Date
    @State private var notes: String
    @State private var selectedParentId: String?
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showingDeleteAlert = false

    init(
        title: String,
        parentOptions: [ParentPlantOption],
        initialDate: Date = Date(),
        initialNotes: String = "",
        initialParentId: String? = nil,
        onSave: @escaping @Sendable (Date, String?, String?) async -> Bool,
        onDelete: (@Sendable () async -> Bool)? = nil
    ) {
        self.title = title
        self.parentOptions = parentOptions
        self.onSave = onSave
        self.onDelete = onDelete
        _eventDate = State(initialValue: initialDate)
        _notes = State(initialValue: initialNotes)
        _selectedParentId = State(initialValue: initialParentId)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Event date")) {
                    DatePicker("Date", selection: $eventDate, displayedComponents: .date)
                }

                Section(header: Text("Parent plant")) {
                    Picker("Parent plant", selection: $selectedParentId) {
                        Text("No parent").tag(String?.none)
                        ForEach(parentOptions) { option in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(option.title)
                                if let subtitle = option.subtitle, !subtitle.isEmpty {
                                    Text(subtitle)
                                        .font(.caption)
                                        .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                                }
                            }
                            .tag(Optional(option.id))
                        }
                    }
                }

                Section(header: Text("Notes")) {
                    TextEditor(text: $notes)
                        .frame(minHeight: 90)
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(Color.red)
                }

                if onDelete != nil {
                    Section {
                        Button("Delete event", role: .destructive) {
                            showingDeleteAlert = true
                        }
                    }
                }
            }
            .navigationTitle(title)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Saving…" : "Save") {
                        Task { await save() }
                    }
                    .disabled(isSaving)
                }
            }
            .alert("Delete this event?", isPresented: $showingDeleteAlert) {
                Button("Delete", role: .destructive) {
                    Task { await deleteEvent() }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This removes the propagation event from the timeline.")
            }
        }
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let trimmedNotes = notes.trimmingCharacters(in: .whitespacesAndNewlines)
        let notesValue = trimmedNotes.isEmpty ? nil : trimmedNotes
        let result = await onSave(eventDate, notesValue, selectedParentId)
        if result {
            dismiss()
        } else {
            errorMessage = "We couldn't save that propagation."
        }
    }

    private func deleteEvent() async {
        guard let onDelete else { return }
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let result = await onDelete()
        if result {
            dismiss()
        } else {
            errorMessage = "We couldn't delete that event."
        }
    }
}

#Preview {
    PropagationEventFormView(
        title: "Edit propagation",
        parentOptions: [
            ParentPlantOption(id: "00000000-0000-0000-0000-000000000001", title: "Monstera", subtitle: "Mona"),
            ParentPlantOption(id: "00000000-0000-0000-0000-000000000002", title: "Pothos", subtitle: nil)
        ],
        initialDate: Date(),
        initialNotes: "Cutting in water.",
        initialParentId: "00000000-0000-0000-0000-000000000001"
    ) { _, _, _ in
        true
    } onDelete: {
        true
    }
}
