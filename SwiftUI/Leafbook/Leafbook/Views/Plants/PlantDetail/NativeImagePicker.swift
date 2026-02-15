//
//  NativeImagePicker.swift
//  Leafbook
//
//  Created by Claude for AJ Glodowski
//

import SwiftUI
import UIKit
import ImageIO

struct NativeImagePicker: UIViewControllerRepresentable {
    let onImagePicked: (UIImage, Date?) -> Void
    let onCancel: () -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .photoLibrary
        picker.allowsEditing = true // This enables the native square crop UI
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onImagePicked: onImagePicked, onCancel: onCancel)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onImagePicked: (UIImage, Date?) -> Void
        let onCancel: () -> Void

        init(onImagePicked: @escaping (UIImage, Date?) -> Void, onCancel: @escaping () -> Void) {
            self.onImagePicked = onImagePicked
            self.onCancel = onCancel
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            // Extract EXIF date from original image
            var exifDate: Date?
            if let imageURL = info[.imageURL] as? URL {
                exifDate = extractExifDate(from: imageURL)
            }

            // Use edited image if available (from crop), otherwise use original
            if let editedImage = info[.editedImage] as? UIImage {
                onImagePicked(editedImage, exifDate)
            } else if let originalImage = info[.originalImage] as? UIImage {
                onImagePicked(originalImage, exifDate)
            }
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            onCancel()
        }

        private func extractExifDate(from imageURL: URL) -> Date? {
            guard let imageSource = CGImageSourceCreateWithURL(imageURL as CFURL, nil),
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
    }
}
