//
//  PlantEditFormView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantEditFormView: View {
    @Environment(\.dismiss) private var dismiss

    let plant: Plant
    let parentOptions: [ParentPlantOption]
    let onSave: @Sendable (String, String?, String?, String?, String?, String?, String?, String?, Date?, String?) async -> Bool

    @State private var name: String
    @State private var nickname: String
    @State private var plantLocation: String
    @State private var location: String
    @State private var lightExposure: String
    @State private var sizeCategory: String
    @State private var howAcquired: String
    @State private var descriptionText: String
    @State private var acquiredAt: Date
    @State private var hasAcquiredDate: Bool
    @State private var originType: PlantOrigin
    @State private var parentPlantId: String
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(
        plant: Plant,
        parentOptions: [ParentPlantOption],
        onSave: @escaping @Sendable (String, String?, String?, String?, String?, String?, String?, String?, Date?, String?) async -> Bool
    ) {
        self.plant = plant
        self.parentOptions = parentOptions
        self.onSave = onSave
        _name = State(initialValue: plant.name)
        _nickname = State(initialValue: plant.nickname ?? "")
        _plantLocation = State(initialValue: plant.plantLocation ?? "")
        _location = State(initialValue: plant.location ?? "")
        _lightExposure = State(initialValue: plant.lightExposure ?? "")
        _sizeCategory = State(initialValue: plant.sizeCategory ?? "")
        _howAcquired = State(initialValue: plant.howAcquired ?? "")
        _descriptionText = State(initialValue: plant.description ?? "")
        let fallbackDate = ISO8601DateFormatter().date(from: plant.acquiredAt ?? "") ?? Date()
        _acquiredAt = State(initialValue: fallbackDate)
        _hasAcquiredDate = State(initialValue: plant.acquiredAt != nil)
        let inferredOrigin = PlantOrigin.infer(from: plant)
        _originType = State(initialValue: inferredOrigin)
        _parentPlantId = State(initialValue: plant.parentPlantId ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Plant")) {
                    TextField("Name", text: $name)
                    TextField("Nickname", text: $nickname)
                    Picker("Environment", selection: $plantLocation) {
                        Text("Not set").tag("")
                        Text("Indoor").tag("indoor")
                        Text("Outdoor").tag("outdoor")
                    }
                    TextField("Location", text: $location)
                }

                Section(header: Text("Care details")) {
                    Picker("Light", selection: $lightExposure) {
                        Text("Not set").tag("")
                        Text("Dark").tag("dark")
                        Text("Low indirect").tag("low_indirect")
                        Text("Medium indirect").tag("medium_indirect")
                        Text("Bright indirect").tag("bright_indirect")
                        Text("Direct").tag("direct")
                    }
                    TextField("Size category", text: $sizeCategory)
                }

                Section(header: Text("Origin")) {
                    Picker("Origin", selection: $originType) {
                        ForEach(PlantOrigin.allCases) { origin in
                            Text(origin.label).tag(origin)
                        }
                    }

                    if originType == .acquired {
                        TextField("How acquired", text: $howAcquired)
                        Toggle("Track acquired date", isOn: $hasAcquiredDate)
                        if hasAcquiredDate {
                            DatePicker("Acquired on", selection: $acquiredAt, displayedComponents: .date)
                        }
                    } else {
                        if parentOptions.isEmpty {
                            Text("No parent plants available yet.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        } else {
                            Picker("Parent plant", selection: $parentPlantId) {
                                Text("Select a parent").tag("")
                                ForEach(parentOptions) { option in
                                    Text(option.title).tag(option.id)
                                }
                            }
                        }
                        Text("We’ll log this as a propagated plant.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }

                Section(header: Text("Notes")) {
                    TextEditor(text: $descriptionText)
                        .frame(minHeight: 140)
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(Color.red)
                }
            }
            .navigationTitle("Edit plant")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Saving…" : "Save") {
                        Task {
                            await save()
                        }
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSaving)
                }
            }
        }
        .onChange(of: originType) { _, newValue in
            if newValue == .acquired {
                parentPlantId = ""
            } else {
                howAcquired = ""
                hasAcquiredDate = false
            }
        }
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        if originType == .propagated, parentPlantId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            errorMessage = "Select a parent plant to log this propagation."
            return
        }

        let resolvedParentId = originType == .propagated ? parentPlantId.nilIfEmpty : nil
        let parentName = resolvedParentId.flatMap { id in
            parentOptions.first(where: { $0.id == id })?.title
        }
        let resolvedHowAcquired: String? = {
            if originType == .propagated {
                return "Propagated from \(parentName ?? "parent plant")"
            }
            return howAcquired.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
        }()

        let result = await onSave(
            trimmedName,
            nickname.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
            plantLocation.nilIfEmpty,
            location.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
            lightExposure.nilIfEmpty,
            sizeCategory.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
            resolvedHowAcquired,
            descriptionText.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty,
            hasAcquiredDate ? acquiredAt : nil,
            resolvedParentId
        )

        if result {
            dismiss()
        } else {
            errorMessage = "We couldn't save those changes."
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
    PlantEditFormView(plant: .preview, parentOptions: [
        ParentPlantOption(id: "00000000-0000-0000-0000-000000000002", title: "Pothos", subtitle: "Perry"),
        ParentPlantOption(id: "00000000-0000-0000-0000-000000000003", title: "Hoya", subtitle: nil)
    ]) { _, _, _, _, _, _, _, _, _, _ in
        true
    }
}
