//
//  PlantIssueFormView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantIssueFormView: View {
    @Environment(\.dismiss) private var dismiss

    let onSave: @Sendable (String, String, String) async -> Bool

    @State private var issueType = "pests"
    @State private var severity = "medium"
    @State private var descriptionText = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    private let issueTypes = ["pests", "rot", "droop", "yellowing", "spots", "other"]
    private let severityLevels = ["low", "medium", "high"]

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Issue")) {
                    Picker("Type", selection: $issueType) {
                        ForEach(issueTypes, id: \.self) { type in
                            Text(type.capitalized).tag(type)
                        }
                    }
                    Picker("Severity", selection: $severity) {
                        ForEach(severityLevels, id: \.self) { level in
                            Text(level.capitalized).tag(level)
                        }
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
            .navigationTitle("Log issue")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Saving…" : "Save") {
                        Task { await save() }
                    }
                    .disabled(isSaving || descriptionText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }

    private func save() async {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let trimmed = descriptionText.trimmingCharacters(in: .whitespacesAndNewlines)
        let result = await onSave(issueType, severity, trimmed)
        if result {
            dismiss()
        } else {
            errorMessage = "We couldn't save that issue."
        }
    }
}

#Preview {
    PlantIssueFormView { _, _, _ in
        true
    }
}
