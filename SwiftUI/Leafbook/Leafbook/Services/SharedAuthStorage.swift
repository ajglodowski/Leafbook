//
//  SharedAuthStorage.swift
//  Leafbook
//
//  Created by AJ Glodowski on 2/10/26.
//

import Foundation
import Auth

/// Auth token storage backed by the App Group shared UserDefaults,
/// so both the main app and the widget extension can access the session.
struct SharedAuthStorage: AuthLocalStorage {
    static let suiteName = "group.com.ajglodo.Leafbook"

    private var defaults: UserDefaults {
        UserDefaults(suiteName: Self.suiteName) ?? .standard
    }

    func store(key: String, value: Data) throws {
        defaults.set(value, forKey: key)
    }

    func retrieve(key: String) throws -> Data? {
        defaults.data(forKey: key)
    }

    func remove(key: String) throws {
        defaults.removeObject(forKey: key)
    }
}
