//
//  MarkAsLegacySheet.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/9/26.
//

import SwiftUI

struct MarkAsLegacySheet: View {
    let onConfirm: (String) async -> Bool

    @Environment(\.dismiss) private var dismiss
    @State private var selectedReason = "Passed away"
    @State private var customReason = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    private let reasons = ["Passed away", "Given away", "Sold", "Other"]

    private var resolvedReason: String {
        if selectedReason == "Other" {
            let trimmed = customReason.trimmingCharacters(in: .whitespacesAndNewlines)
            return trimmed.isEmpty ? "Other" : trimmed
        }
        return selectedReason
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("This plant will be moved to your legacy collection. All history will be preserved and you can restore it at any time.")
                        .font(.subheadline)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                }

                Section("Reason") {
                    Picker("Reason", selection: $selectedReason) {
                        ForEach(reasons, id: \.self) { reason in
                            Text(reason).tag(reason)
                        }
                    }
                    .pickerStyle(.menu)

                    if selectedReason == "Other" {
                        TextField("Describe what happened", text: $customReason, axis: .vertical)
                            .lineLimit(2...3)
                    }
                }

                if let errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                            .font(.footnote)
                    }
                }
            }
            .navigationTitle("Mark as Legacy")
#if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
#endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Saving..." : "Confirm") {
                        Task { await handleConfirm() }
                    }
                    .disabled(isSaving)
                    .tint(.red)
                }
            }
        }
    }

    private func handleConfirm() async {
        isSaving = true
        errorMessage = nil
        let success = await onConfirm(resolvedReason)
        if success {
            dismiss()
        } else {
            errorMessage = "We couldn't mark this plant as legacy."
        }
        isSaving = false
    }
}

#Preview {
    MarkAsLegacySheet { _ in true }
}
