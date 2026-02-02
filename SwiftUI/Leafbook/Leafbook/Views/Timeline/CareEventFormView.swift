//
//  CareEventFormView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/1/26.
//

import SwiftUI

struct CareEventFormView: View {
    @Environment(\.dismiss) private var dismiss

    let title: String
    let onSave: @Sendable (Date, String?) async -> Bool
    let onDelete: (@Sendable () async -> Bool)?

    @State private var eventDate: Date
    @State private var notes: String
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showingDeleteAlert = false

    init(
        title: String,
        initialDate: Date = Date(),
        initialNotes: String = "",
        onSave: @escaping @Sendable (Date, String?) async -> Bool,
        onDelete: (@Sendable () async -> Bool)? = nil
    ) {
        self.title = title
        self.onSave = onSave
        self.onDelete = onDelete
        _eventDate = State(initialValue: initialDate)
        _notes = State(initialValue: initialNotes)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Event date")) {
                    DatePicker("Date", selection: $eventDate, displayedComponents: .date)
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
                Text("This removes the event from the timeline. This can’t be undone.")
            }
        }
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let trimmedNotes = notes.trimmingCharacters(in: .whitespacesAndNewlines)
        let notesValue = trimmedNotes.isEmpty ? nil : trimmedNotes
        let result = await onSave(eventDate, notesValue)
        if result {
            dismiss()
        } else {
            errorMessage = "We couldn't save that event."
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
    CareEventFormView(
        title: "Edit watering",
        initialDate: Date(),
        initialNotes: "Thorough soak."
    ) { _, _ in
        true
    } onDelete: {
        true
    }
}
