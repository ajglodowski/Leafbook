//
//  PropagatePlantView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/4/26.
//

import SwiftUI

struct PropagatePlantView: View {
    @Environment(\.dismiss) private var dismiss

    let parentPlantName: String
    let onCreate: @Sendable (PropagationDraft) async -> String?
    let onCreated: (String) -> Void

    @State private var name: String
    @State private var nickname = ""
    @State private var plantLocation: PlantLocation = .indoor
    @State private var location = ""
    @State private var lightExposure: LightRequirement? = nil
    @State private var propagationDate = Date()
    @State private var notes = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(
        parentPlantName: String,
        onCreate: @escaping @Sendable (PropagationDraft) async -> String?,
        onCreated: @escaping (String) -> Void
    ) {
        self.parentPlantName = parentPlantName
        self.onCreate = onCreate
        self.onCreated = onCreated
        _name = State(initialValue: "\(parentPlantName) Jr.")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("Create a new plant from \(parentPlantName). The new plant will be linked as a child of this parent.")
                        .font(.footnote)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                }

                Section(header: Text("Propagation")) {
                    TextField("Name *", text: $name)
                    TextField("Nickname (optional)", text: $nickname)
                    DatePicker("Propagation date", selection: $propagationDate, displayedComponents: .date)
                }

                Section(header: Text("Environment")) {
                    Picker("Environment", selection: $plantLocation) {
                        Text("Indoor").tag(PlantLocation.indoor)
                        Text("Outdoor").tag(PlantLocation.outdoor)
                    }
                    .pickerStyle(.segmented)

                    TextField("Location (optional)", text: $location)

                    Picker("Light exposure (optional)", selection: $lightExposure) {
                        Text("Not set").tag(nil as LightRequirement?)
                        ForEach(LightRequirement.allCases, id: \.self) { light in
                            Text(light.displayName).tag(light as LightRequirement?)
                        }
                    }
                }

                Section(header: Text("Notes")) {
                    TextEditor(text: $notes)
                        .frame(minHeight: 100)
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(Color.red)
                }
            }
            .navigationTitle("Create propagation")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Creating…" : "Create") {
                        Task { await createPropagation() }
                    }
                    .disabled(isSaving || name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }

    private func createPropagation() async {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedName.isEmpty else {
            errorMessage = "Name is required."
            return
        }

        let draft = PropagationDraft(
            name: trimmedName,
            nickname: nickname.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
            plantLocation: plantLocation,
            location: location.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
            lightExposure: lightExposure,
            propagationDate: propagationDate,
            notes: notes.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
        )

        if let newPlantId = await onCreate(draft) {
            dismiss()
            onCreated(newPlantId)
        } else {
            errorMessage = "We couldn't create that propagation."
        }
    }
}

private extension String {
    var nilIfEmpty: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}

#Preview {
    PropagatePlantView(parentPlantName: "Pothos") { _ in
        "new-plant"
    } onCreated: { _ in
    }
}
