//
//  PlantPhotoUploadSheet.swift
//  Leafbook
//
//  Created by Claude for AJ Glodowski
//

import SwiftUI
import PhotosUI
import ImageIO

struct PlantPhotoUploadSheet: View {
    let plantName: String
    let onUpload: (Data, Date, String?) async -> String?

    @Environment(\.dismiss) private var dismiss
    @State private var selectedItem: PhotosPickerItem?
    @State private var processedImageData: Data?
    @State private var takenAt: Date = Date()
    @State private var caption: String = ""
    @State private var errorMessage: String?
    @State private var isUploading = false
    @State private var isProcessing = false

    var body: some View {
        NavigationStack {
            Form {
                if processedImageData == nil {
                    Section {
                        PhotosPicker(selection: $selectedItem, matching: .images) {
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
            .navigationTitle("Add Photo")
#if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
#endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .disabled(isUploading || isProcessing)
                }
                ToolbarItem(placement: .confirmationAction) {
                    if processedImageData != nil {
                        Button(isUploading ? "Uploading..." : "Upload") {
                            Task { await handleUpload() }
                        }
                        .disabled(isUploading || isProcessing)
                    }
                }
            }
            .onChange(of: selectedItem) { _, newItem in
                Task {
                    await processSelectedImage(newItem)
                }
            }
            .overlay {
                if isProcessing {
                    ZStack {
                        Color.black.opacity(0.3)
                            .ignoresSafeArea()
                        VStack(spacing: 12) {
                            ProgressView()
                                .scaleEffect(1.5)
                            Text("Processing image...")
                                .font(.subheadline)
                                .foregroundStyle(.white)
                        }
                        .padding(24)
                        .background(Color.black.opacity(0.7))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
        }
    }

    private func processSelectedImage(_ item: PhotosPickerItem?) async {
        guard let item else { return }

        isProcessing = true
        errorMessage = nil

        do {
            // Load image data
            guard let data = try await item.loadTransferable(type: Data.self) else {
                errorMessage = "Failed to load image"
                isProcessing = false
                return
            }

            // Extract EXIF date
            if let exifDate = extractExifDate(from: data) {
                takenAt = exifDate
            }

            // Crop and resize image
            if let croppedData = cropToSquare(imageData: data) {
                processedImageData = croppedData
            } else {
                errorMessage = "Failed to process image"
            }
        } catch {
            errorMessage = "Failed to load image: \(error.localizedDescription)"
        }

        isProcessing = false
    }

    private func extractExifDate(from imageData: Data) -> Date? {
        guard let imageSource = CGImageSourceCreateWithData(imageData as CFData, nil),
              let properties = CGImageSourceCopyPropertiesAtIndex(imageSource, 0, nil) as? [String: Any],
              let exifDict = properties[kCGImagePropertyExifDictionary as String] as? [String: Any],
              let dateString = exifDict[kCGImagePropertyExifDateTimeOriginal as String] as? String else {
            return nil
        }

        // EXIF date format: "yyyy:MM:dd HH:mm:ss"
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy:MM:dd HH:mm:ss"
        return formatter.date(from: dateString)
    }

    private func cropToSquare(imageData: Data) -> Data? {
        guard let uiImage = UIImage(data: imageData),
              let cgImage = uiImage.cgImage else {
            return nil
        }

        let width = cgImage.width
        let height = cgImage.height
        let size = min(width, height)

        // Calculate center crop rect
        let x = (width - size) / 2
        let y = (height - size) / 2
        let cropRect = CGRect(x: x, y: y, width: size, height: size)

        guard let croppedCGImage = cgImage.cropping(to: cropRect) else {
            return nil
        }

        // Resize to 1024x1024 and convert to JPEG
        let targetSize = CGSize(width: 1024, height: 1024)
        let renderer = UIGraphicsImageRenderer(size: targetSize)
        let resizedImage = renderer.image { _ in
            UIImage(cgImage: croppedCGImage).draw(in: CGRect(origin: .zero, size: targetSize))
        }

        return resizedImage.jpegData(compressionQuality: 0.9)
    }

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
