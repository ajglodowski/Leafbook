//
//  SetParentPlantView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/4/26.
//

import SwiftUI

struct SetParentPlantView: View {
    @Environment(\.dismiss) private var dismiss

    let plantName: String
    let currentParent: PropagationPlant?
    let availableParents: [PropagationPlant]
    let onSave: @Sendable (String, Date?) async -> Bool
    let onClear: @Sendable () async -> Bool

    @State private var selectedParentId: String
    @State private var searchText = ""
    @State private var propagationDate: Date
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(
        plantName: String,
        currentParent: PropagationPlant?,
        availableParents: [PropagationPlant],
        onSave: @escaping @Sendable (String, Date?) async -> Bool,
        onClear: @escaping @Sendable () async -> Bool
    ) {
        self.plantName = plantName
        self.currentParent = currentParent
        self.availableParents = availableParents
        self.onSave = onSave
        self.onClear = onClear
        _selectedParentId = State(initialValue: currentParent?.id ?? "")
        _propagationDate = State(initialValue: Date())
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("Link \(plantName) to its parent plant to track propagation lineage.")
                        .font(.footnote)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                }

                if let currentParent {
                    Section {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Current parent")
                                .font(.subheadline.weight(.semibold))
                            Text(currentParent.displayName)
                                .font(.subheadline)
                                .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.vertical, 6)
                    }
                }

                Section(header: Text("Parent plant")) {
                    TextField("Search plants", text: $searchText)
                        .textFieldStyle(.roundedBorder)

                    if filteredParents.isEmpty {
                        Text("No plants available.")
                            .font(.footnote)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                    } else {
                        ForEach(filteredParents) { plant in
                            Button {
                                selectedParentId = plant.id
                            } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(plant.name)
                                            .foregroundStyle(LeafbookColors.foreground)
                                        if let nickname = plant.nickname, !nickname.isEmpty {
                                            Text(nickname)
                                                .font(.caption)
                                                .italic()
                                                .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                                        }
                                    }
                                    Spacer()
                                    if plant.id == selectedParentId {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(LeafbookColors.primary)
                                    }
                                }
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                if shouldShowDatePicker {
                    Section(header: Text("Propagation date")) {
                        DatePicker("Date", selection: $propagationDate, displayedComponents: .date)
                        Text("When was this cutting taken from the parent?")
                            .font(.footnote)
                            .foregroundStyle(LeafbookColors.foreground.opacity(0.6))
                    }
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(Color.red)
                }

                if currentParent != nil {
                    Section {
                        Button("Remove parent", role: .destructive) {
                            Task { await clearParent() }
                        }
                    }
                }
            }
            .navigationTitle(currentParent == nil ? "Set parent plant" : "Change parent plant")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Saving…" : "Save") {
                        Task { await saveParent() }
                    }
                    .disabled(isSaving || !canSave)
                }
            }
        }
    }

    private var filteredParents: [PropagationPlant] {
        let trimmed = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return availableParents }
        let lower = trimmed.lowercased()
        return availableParents.filter { plant in
            plant.name.lowercased().contains(lower) ||
                (plant.nickname?.lowercased().contains(lower) ?? false)
        }
    }

    private var canSave: Bool {
        !selectedParentId.isEmpty && selectedParentId != currentParent?.id
    }

    private var shouldShowDatePicker: Bool {
        !selectedParentId.isEmpty && selectedParentId != currentParent?.id
    }

    private func saveParent() async {
        guard canSave else { return }
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let result = await onSave(selectedParentId, propagationDate)
        if result {
            dismiss()
        } else {
            errorMessage = "We couldn't save that parent plant."
        }
    }

    private func clearParent() async {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let result = await onClear()
        if result {
            dismiss()
        } else {
            errorMessage = "We couldn't remove that parent plant."
        }
    }
}

#Preview {
    SetParentPlantView(
        plantName: "Monstera",
        currentParent: .previewParent,
        availableParents: [.previewParent, .previewChild]
    ) { _, _ in
        true
    } onClear: {
        true
    }
    .environmentObject(SessionState(isPreview: true))
}
