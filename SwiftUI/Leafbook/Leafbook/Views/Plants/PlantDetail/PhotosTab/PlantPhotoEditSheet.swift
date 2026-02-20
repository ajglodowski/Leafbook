//
//  PlantPhotoEditSheet.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/4/26.
//

import SwiftUI

struct PlantPhotoEditSheet: View {
    let photo: PlantPhoto
    let onSave: (Date, String?) async -> String?

    @Environment(\.dismiss) private var dismiss
    @State private var caption: String
    @State private var takenAt: Date
    @State private var errorMessage: String?
    @State private var isSaving = false

    init(photo: PlantPhoto, onSave: @escaping (Date, String?) async -> String?) {
        self.photo = photo
        self.onSave = onSave
        _caption = State(initialValue: photo.caption ?? "")
        _takenAt = State(initialValue: Self.initialDate(from: photo.takenAt))
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    DatePicker(
                        "Taken on",
                        selection: $takenAt,
                        displayedComponents: [.date, .hourAndMinute]
                    )

                    TextField("Caption", text: $caption, axis: .vertical)
                        .lineLimit(2...3)
                }

                if let errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                            .font(.footnote)
                    }
                }
            }
            .navigationTitle("Edit photo")
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
                    Button(isSaving ? "Saving..." : "Save") {
                        Task { await handleSave() }
                    }
                    .disabled(isSaving)
                }
            }
        }
    }

    private func handleSave() async {
        isSaving = true
        errorMessage = nil
        let trimmedCaption = caption.trimmingCharacters(in: .whitespacesAndNewlines)
        let result = await onSave(takenAt, trimmedCaption.isEmpty ? nil : trimmedCaption)
        if let result {
            errorMessage = result
        } else {
            dismiss()
        }
        isSaving = false
    }

    private static func initialDate(from dateString: String?) -> Date {
        guard let dateString,
              let date = DashboardUtils.parseDate(dateString) else {
            return Date()
        }
        return date
    }
}

#Preview {
    PlantPhotoEditSheet(photo: .preview) { _, _ in
        nil
    }
}
