//
//  PlantPhotoUploadSheet.swift
//  Leafbook
//
//  Created by Claude for AJ Glodowski
//

import SwiftUI
import ImageIO

struct PlantPhotoUploadSheet: View {
    let plantName: String
    let onUpload: (Data, Date, String?) async -> String?

    @Environment(\.dismiss) private var dismiss
    @State private var showingPicker = false
    @State private var processedImageData: Data?
    @State private var takenAt: Date = Date()
    @State private var caption: String = ""
    @State private var errorMessage: String?
    @State private var isUploading = false

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Button("Cancel") {
                    dismiss()
                }
                .disabled(isUploading)

                Spacer()

                Text("Add Photo")
                    .font(.headline)

                Spacer()

                if processedImageData != nil {
                    Button(isUploading ? "Uploading..." : "Upload") {
                        Task { await handleUpload() }
                    }
                    .disabled(isUploading)
                    .fontWeight(.semibold)
                } else {
                    Button("Upload") {}
                        .disabled(true)
                        .hidden()
                }
            }
            .padding()
            .background(Color(.systemBackground))

            Divider()

            // Content
            Form {
                if processedImageData == nil {
                    Section {
                        Button {
                            showingPicker = true
                        } label: {
                            Label("Select Photo", systemImage: "photo.on.rectangle.angled")
                        }
                    } header: {
                        Text("Choose a photo")
                    } footer: {
                        Text("Select a photo from your library to add to \(plantName)")
                    }
                } else {
                    Section {
                        if let imageData = processedImageData, let uiImage = UIImage(data: imageData) {
                            Image(uiImage: uiImage)
                                .resizable()
                                .scaledToFit()
                                .frame(maxHeight: 300)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    } header: {
                        Text("Preview")
                    }

                    Section {
                        DatePicker(
                            "Taken on",
                            selection: $takenAt,
                            displayedComponents: [.date, .hourAndMinute]
                        )

                        TextField("Caption (optional)", text: $caption, axis: .vertical)
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
        }
        .fullScreenCover(isPresented: $showingPicker) {
            NativeImagePicker(
                onImagePicked: { image, exifDate in
                    showingPicker = false
                    handlePickedImage(image, exifDate: exifDate)
                },
                onCancel: {
                    showingPicker = false
                }
            )
            .ignoresSafeArea()
        }
    }

    @MainActor
    private func handlePickedImage(_ image: UIImage, exifDate: Date?) {
        // The image comes from native picker already cropped/edited by user
        // Resize to 1024x1024 and convert to JPEG
        let targetSize = CGSize(width: 1024, height: 1024)
        let renderer = UIGraphicsImageRenderer(size: targetSize)
        let resizedImage = renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }

        processedImageData = resizedImage.jpegData(compressionQuality: 0.9)

        // Use EXIF date from original image if available, otherwise use current date
        takenAt = exifDate ?? Date()
    }

    @MainActor
    private func handleUpload() async {
        guard let imageData = processedImageData else { return }

        isUploading = true
        errorMessage = nil

        let trimmedCaption = caption.trimmingCharacters(in: .whitespacesAndNewlines)
        let result = await onUpload(
            imageData,
            takenAt,
            trimmedCaption.isEmpty ? nil : trimmedCaption
        )

        if let result {
            errorMessage = result
            isUploading = false
        } else {
            dismiss()
        }
    }
}

#Preview {
    PlantPhotoUploadSheet(plantName: "Monstera deliciosa") { _, _, _ in
        nil
    }
}
