//
//  PlantCarePreferencesFormView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantCarePreferencesFormView: View {
    @Environment(\.dismiss) private var dismiss

    let initialWateringDays: Int?
    let initialFertilizingDays: Int?
    let onSave: @Sendable (Int?, Int?) async -> Bool

    @State private var wateringDays: String
    @State private var fertilizingDays: String
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(
        initialWateringDays: Int?,
        initialFertilizingDays: Int?,
        onSave: @escaping @Sendable (Int?, Int?) async -> Bool
    ) {
        self.initialWateringDays = initialWateringDays
        self.initialFertilizingDays = initialFertilizingDays
        self.onSave = onSave
        _wateringDays = State(initialValue: initialWateringDays.map(String.init) ?? "")
        _fertilizingDays = State(initialValue: initialFertilizingDays.map(String.init) ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Care cadence")) {
                    numericTextField("Water every (days)", text: $wateringDays)
                    numericTextField("Fertilize every (days)", text: $fertilizingDays)
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(Color.red)
                }
            }
            .navigationTitle("Care preferences")
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

        let watering = Int(wateringDays.trimmingCharacters(in: .whitespacesAndNewlines))
        let fertilizing = Int(fertilizingDays.trimmingCharacters(in: .whitespacesAndNewlines))
        let result = await onSave(watering, fertilizing)
        if result {
            dismiss()
        } else {
            errorMessage = "We couldn't update those settings."
        }
    }

    @ViewBuilder
    private func numericTextField(_ title: String, text: Binding<String>) -> some View {
#if os(iOS)
        TextField(title, text: text)
            .keyboardType(.numberPad)
#else
        TextField(title, text: text)
#endif
    }
}

#Preview {
    PlantCarePreferencesFormView(initialWateringDays: 10, initialFertilizingDays: 30) { _, _ in
        true
    }
}
