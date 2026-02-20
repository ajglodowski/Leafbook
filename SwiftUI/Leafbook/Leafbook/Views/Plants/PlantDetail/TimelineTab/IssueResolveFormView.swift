//
//  IssueResolveFormView.swift
//  Leafbook
//

import SwiftUI

struct IssueResolveFormView: View {
    @Environment(\.dismiss) private var dismiss

    let issue: PlantIssue
    let onSave: @Sendable (String?) async -> Bool

    @State private var resolutionNotes = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Issue")) {
                    LabeledContent("Type", value: issue.issueType.displayName)
                    if let severity = issue.severity {
                        LabeledContent("Severity", value: severity.displayName)
                    }
                    if let description = issue.description, !description.isEmpty {
                        Text(description)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }

                Section(header: Text("Resolution notes (optional)")) {
                    TextEditor(text: $resolutionNotes)
                        .frame(minHeight: 100)
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(Color.red)
                }
            }
            .navigationTitle("Resolve issue")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Resolving…" : "Resolve") {
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

        let trimmed = resolutionNotes.trimmingCharacters(in: .whitespacesAndNewlines)
        let notes = trimmed.isEmpty ? nil : trimmed
        let result = await onSave(notes)
        if result {
            dismiss()
        } else {
            errorMessage = "We couldn't resolve that issue."
        }
    }
}

#Preview {
    IssueResolveFormView(
        issue: PlantIssue(
            id: "preview",
            plantId: "plant1",
            issueType: .pest,
            severity: .medium,
            status: .active,
            description: "Found aphids on leaves",
            startedAt: "2026-02-10",
            resolvedAt: nil,
            resolutionNotes: nil,
            plant: nil
        )
    ) { _ in true }
}
