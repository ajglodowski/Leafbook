//
//  PlantMoveFormView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/1/26.
//

import SwiftUI

struct PlantMoveFormView: View {
    @Environment(\.dismiss) private var dismiss

    let currentLocation: String?
    let title: String
    let onSave: @Sendable (Date, String, String?) async -> Bool
    let onDelete: (@Sendable () async -> Bool)?

    @State private var moveDate: Date
    @State private var destination: String
    @State private var notes: String
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showingDeleteAlert = false

    init(
        currentLocation: String?,
        initialDate: Date = Date(),
        initialDestination: String = "",
        initialNotes: String = "",
        title: String = "Move",
        onSave: @escaping @Sendable (Date, String, String?) async -> Bool,
        onDelete: (@Sendable () async -> Bool)? = nil
    ) {
        self.currentLocation = currentLocation
        self.title = title
        self.onSave = onSave
        self.onDelete = onDelete
        _moveDate = State(initialValue: initialDate)
        _destination = State(initialValue: initialDestination)
        _notes = State(initialValue: initialNotes)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Move details")) {
                    DatePicker("Date", selection: $moveDate, displayedComponents: .date)
                    TextField("New location", text: $destination)
                }

                if let currentLocation, !currentLocation.isEmpty {
                    Section(header: Text("Current location")) {
                        Text(currentLocation)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(LeafbookColors.foreground)
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
                Text("This removes the move event from the timeline.")
            }
        }
    }

    private func save() async {
        let trimmedDestination = destination.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedDestination.isEmpty else {
            errorMessage = "Please add a destination."
            return
        }

        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let trimmedNotes = notes.trimmingCharacters(in: .whitespacesAndNewlines)
        let notesValue = trimmedNotes.isEmpty ? nil : trimmedNotes
        let result = await onSave(moveDate, trimmedDestination, notesValue)
        if result {
            dismiss()
        } else {
            errorMessage = "We couldn't log that move."
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
    PlantMoveFormView(
        currentLocation: "Living room window",
        initialDestination: "Bedroom shelf",
        initialNotes: "Rotated toward brighter light."
    ) { _, _, _ in
        true
    }
}
