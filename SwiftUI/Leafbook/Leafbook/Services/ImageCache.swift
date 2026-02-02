//
//  ImageCache.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Combine
import SwiftUI

#if os(iOS) || os(tvOS) || os(watchOS)
typealias PlatformImage = UIImage
#elseif os(macOS)
typealias PlatformImage = NSImage
#endif

final class ImageCache {
    static let shared = ImageCache()

    
    private let cache: NSCache<NSURL, PlatformImage> = {
        let cache = NSCache<NSURL, PlatformImage>()
        cache.countLimit = 25
        cache.totalCostLimit = 1024 * 1024 * 100 // 100 MB
        return cache
    }()

    func image(for url: URL) -> PlatformImage? {
        cache.object(forKey: url as NSURL)
    }

    func insert(_ image: PlatformImage, for url: URL) {
        cache.setObject(image, forKey: url as NSURL)
    }
}

@MainActor
final class CachedImageLoader: ObservableObject {
    @Published var image: Image?
    @Published var isLoading = false

    func load(from url: URL?) async {
        guard let url else { return }
        if let cached = ImageCache.shared.image(for: url) {
            image = Image(platformImage: cached)
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            #if os(iOS) || os(tvOS) || os(watchOS)
            if let platformImage = PlatformImage(data: data) {
                ImageCache.shared.insert(platformImage, for: url)
                image = Image(uiImage: platformImage)
            }
            #elseif os(macOS)
            if let platformImage = PlatformImage(data: data) {
                ImageCache.shared.insert(platformImage, for: url)
                image = Image(nsImage: platformImage)
            }
            #endif
        } catch {
            print("Failed to load image at \(url): \(error)")
            image = nil
        }
    }
}

private extension Image {
    init(platformImage: PlatformImage) {
        #if os(iOS) || os(tvOS) || os(watchOS)
        self = Image(uiImage: platformImage)
        #elseif os(macOS)
        self = Image(nsImage: platformImage)
        #endif
    }
}
