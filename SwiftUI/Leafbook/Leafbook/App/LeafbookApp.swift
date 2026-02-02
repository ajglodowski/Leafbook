//
//  LeafbookApp.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

@main
struct LeafbookApp: App {
    @StateObject private var sessionState = SessionState()
    @StateObject private var appearanceSettings = AppearanceSettings()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(sessionState)
                .environmentObject(appearanceSettings)
                .preferredColorScheme(appearanceSettings.preferredColorScheme)
        }
    }
}
