//
//  PlantIssueFormView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/27/26.
//

import SwiftUI

struct PlantIssueFormView: View {
    @Environment(\.dismiss) private var dismiss

    let onSave: @Sendable (IssueType, IssueSeverity, String) async -> Bool

    @State private var issueType: IssueType = .pest
    @State private var severity: IssueSeverity = .medium
    @State private var descriptionText = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    private let issueTypes: [IssueType] = [
        .pest,
        .disease,
        .overwatering,
        .underwatering,
        .rootRot,
        .yellowing,
        .browning,
        .wilting,
        .other
    ]
    private let severityLevels: [IssueSeverity] = [.low, .medium, .high]

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Issue")) {
                    Picker("Type", selection: $issueType) {
                        ForEach(issueTypes, id: \.self) { type in
                            Text(type.displayName).tag(type)
                        }
                    }
                    Picker("Severity", selection: $severity) {
                        ForEach(severityLevels, id: \.self) { level in
                            Text(level.displayName).tag(level)
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
    PlantIssueFormView { (_: IssueType, _: IssueSeverity, _: String) in
        true
    }
}
