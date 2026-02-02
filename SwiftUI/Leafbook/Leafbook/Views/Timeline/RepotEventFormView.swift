//
//  RepotEventFormView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/1/26.
//

import SwiftUI

struct RepotEventFormView: View {
    @Environment(\.dismiss) private var dismiss

    let title: String
    let currentPot: PlantPot?
    let availablePots: [PlantPot]
    let onSave: @Sendable (Date, String?) async -> Bool
    let onDelete: (@Sendable () async -> Bool)?

    @State private var eventDate: Date
    @State private var selectedPotId: String?
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showingDeleteAlert = false

    init(
        title: String,
        currentPot: PlantPot?,
        availablePots: [PlantPot],
        initialDate: Date = Date(),
        initialPotId: String? = nil,
        onSave: @escaping @Sendable (Date, String?) async -> Bool,
        onDelete: (@Sendable () async -> Bool)? = nil
    ) {
        self.title = title
        self.currentPot = currentPot
        self.availablePots = availablePots
        self.onSave = onSave
        self.onDelete = onDelete
        _eventDate = State(initialValue: initialDate)
        _selectedPotId = State(initialValue: initialPotId)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Event date")) {
                    DatePicker("Date", selection: $eventDate, displayedComponents: .date)
                }

                Section(header: Text("Select pot")) {
                    Picker("Pot", selection: $selectedPotId) {
                        Text("No pot").tag(String?.none)
                        ForEach(availablePots) { pot in
                            Text(pot.name).tag(Optional(pot.id))
                        }
                    }
                }

                if let currentPot {
                    Section(header: Text("Current pot")) {
                        Text(currentPot.name)
                            .font(.subheadline.weight(.semibold))
                        Text(potDetails(currentPot))
                            .font(.caption)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                    }
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
                Text("This removes the repot event from the timeline.")
            }
        }
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let result = await onSave(eventDate, selectedPotId)
        if result {
            dismiss()
        } else {
            errorMessage = "We couldn't save that repot."
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

    private func potDetails(_ pot: PlantPot) -> String {
        let parts = [
            pot.sizeInches.map { "\($0)" + "\"" },
            pot.material
        ]
        return parts.compactMap { $0 }.joined(separator: " · ")
    }
}

#Preview {
    RepotEventFormView(
        title: "Edit repot",
        currentPot: .preview,
        availablePots: [.preview],
        initialDate: Date(),
        initialPotId: PlantPot.preview.id
    ) { _, _ in
        true
    } onDelete: {
        true
    }
}
