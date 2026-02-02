//
//  SettingsView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var appearanceSettings: AppearanceSettings
    @EnvironmentObject private var sessionState: SessionState

    var body: some View {
        Form {
            Section(header: Text("Appearance")) {
                Picker("Theme", selection: Binding(
                    get: { appearanceSettings.theme },
                    set: { appearanceSettings.theme = $0 }
                )) {
                    ForEach(AppearanceSettings.ThemeOption.allCases) { option in
                        Text(option.label).tag(option)
                    }
                }
            }

            Section(header: Text("Account")) {
                Button(role: .destructive) {
                    Task { await sessionState.signOut() }
                } label: {
                    Text("Sign Out")
                }
            }
        }
        .navigationTitle("Settings")
    }
}

#Preview {
    NavigationStack {
        SettingsView()
    }
    .environmentObject(AppearanceSettings())
    .environmentObject(SessionState(isPreview: true))
}
