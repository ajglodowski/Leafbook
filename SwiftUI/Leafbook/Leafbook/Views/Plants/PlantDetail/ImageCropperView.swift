//
//  ImageCropperView.swift
//  Leafbook
//
//  Created by Claude for AJ Glodowski
//

import SwiftUI

struct ImageCropperView: View {
    let image: UIImage
    let onCrop: (UIImage) -> Void
    let onCancel: () -> Void

    @State private var scale: CGFloat = 1.0
    @State private var lastScale: CGFloat = 1.0
    @State private var offset: CGSize = .zero
    @State private var lastOffset: CGSize = .zero

    private let cropSize: CGFloat = 300

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.black
                    .ignoresSafeArea()

                // Image with pan and zoom
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .scaleEffect(scale)
                    .offset(offset)
                    .gesture(
                        SimultaneousGesture(
                            MagnificationGesture()
                                .onChanged { value in
                                    let delta = value / lastScale
                                    lastScale = value
                                    scale = min(max(scale * delta, 1.0), 4.0)
                                }
                                .onEnded { _ in
                                    lastScale = 1.0
                                },
                            DragGesture()
                                .onChanged { value in
                                    let newOffset = CGSize(
                                        width: lastOffset.width + value.translation.width,
                                        height: lastOffset.height + value.translation.height
                                    )
                                    offset = constrainOffset(newOffset, in: geometry.size)
                                }
                                .onEnded { value in
                                    lastOffset = offset
                                }
                        )
                    )

                // Crop region overlay
                Rectangle()
                    .strokeBorder(Color.white, lineWidth: 2)
                    .frame(width: cropSize, height: cropSize)
                    .allowsHitTesting(false)

                // Dimmed overlay outside crop region
                Rectangle()
                    .fill(Color.black.opacity(0.5))
                    .frame(width: geometry.size.width, height: geometry.size.height)
                    .mask(
                        Rectangle()
                            .frame(width: geometry.size.width, height: geometry.size.height)
                            .overlay(
                                Rectangle()
                                    .frame(width: cropSize, height: cropSize)
                                    .blendMode(.destinationOut)
                            )
                    )
                    .allowsHitTesting(false)

                // Buttons
                VStack {
                    HStack {
                        Button("Cancel") {
                            onCancel()
                        }
                        .foregroundStyle(.white)
                        .padding()

                        Spacer()

                        Button("Choose") {
                            cropImage(in: geometry.size)
                        }
                        .foregroundStyle(.white)
                        .fontWeight(.semibold)
                        .padding()
                    }

                    Spacer()
                }
            }
        }
        .onAppear {
            // Calculate initial scale to fit image in crop region
            let imageSize = image.size
            let fitScale = cropSize / min(imageSize.width, imageSize.height)
            scale = max(fitScale, 1.0)
            lastScale = 1.0
        }
    }

    private func constrainOffset(_ offset: CGSize, in viewSize: CGSize) -> CGSize {
        let imageSize = CGSize(
            width: image.size.width * scale,
            height: image.size.height * scale
        )

        let maxOffsetX = max((imageSize.width - cropSize) / 2, 0)
        let maxOffsetY = max((imageSize.height - cropSize) / 2, 0)

        return CGSize(
            width: min(max(offset.width, -maxOffsetX), maxOffsetX),
            height: min(max(offset.height, -maxOffsetY), maxOffsetY)
        )
    }

    private func cropImage(in viewSize: CGSize) {
        let imageSize = image.size

        // Calculate the displayed image size (scaled to fit in view)
        let imageAspect = imageSize.width / imageSize.height
        let viewAspect = viewSize.width / viewSize.height

        let displayedWidth: CGFloat
        let displayedHeight: CGFloat

        if imageAspect > viewAspect {
            displayedWidth = viewSize.width
            displayedHeight = viewSize.width / imageAspect
        } else {
            displayedHeight = viewSize.height
            displayedWidth = viewSize.height * imageAspect
        }

        // Apply user scale
        let scaledWidth = displayedWidth * scale
        let scaledHeight = displayedHeight * scale

        // Calculate image position in view (centered, with offset applied)
        let imageX = (viewSize.width - scaledWidth) / 2 + offset.width
        let imageY = (viewSize.height - scaledHeight) / 2 + offset.height

        // Crop region in view coordinates (centered)
        let cropRegionX = (viewSize.width - cropSize) / 2
        let cropRegionY = (viewSize.height - cropSize) / 2

        // Calculate crop region relative to image
        let cropInImageX = (cropRegionX - imageX) / scaledWidth
        let cropInImageY = (cropRegionY - imageY) / scaledHeight
        let cropInImageWidth = cropSize / scaledWidth
        let cropInImageHeight = cropSize / scaledHeight

        // Convert to actual image coordinates
        let cropRect = CGRect(
            x: cropInImageX * imageSize.width,
            y: cropInImageY * imageSize.height,
            width: cropInImageWidth * imageSize.width,
            height: cropInImageHeight * imageSize.height
        )

        // Perform the crop
        guard let cgImage = image.cgImage,
              let croppedCGImage = cgImage.cropping(to: cropRect) else {
            onCancel()
            return
        }

        let croppedImage = UIImage(cgImage: croppedCGImage, scale: 1.0, orientation: .up)
        onCrop(croppedImage)
    }
}

#Preview {
    ImageCropperView(
        image: UIImage(systemName: "photo")!,
        onCrop: { _ in },
        onCancel: {}
    )
}
