//
//  PlantRepotFormView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantRepotFormView: View {
    @Environment(\.dismiss) private var dismiss

    let currentPot: PlantPot?
    let availablePots: [PlantPot]
    let onSave: @Sendable (String?) async -> Bool

    @State private var selectedPotId: String
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(
        currentPot: PlantPot?,
        availablePots: [PlantPot],
        onSave: @escaping @Sendable (String?) async -> Bool
    ) {
        self.currentPot = currentPot
        self.availablePots = availablePots
        self.onSave = onSave
        _selectedPotId = State(initialValue: currentPot?.id ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Select pot")) {
                    Picker("Pot", selection: $selectedPotId) {
                        Text("No pot").tag("")
                        ForEach(availablePots) { pot in
                            Text(pot.name).tag(pot.id)
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
            }
            .navigationTitle("Repot")
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
        }
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let potId = selectedPotId.isEmpty ? nil : selectedPotId
        let result = await onSave(potId)
        if result {
            dismiss()
        } else {
            errorMessage = "We couldn't update that pot."
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
    PlantRepotFormView(currentPot: .preview, availablePots: [.preview]) { _ in
        true
    }
}
