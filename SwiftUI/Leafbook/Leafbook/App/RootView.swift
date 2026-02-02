//
//  RootView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct RootView: View {
    @EnvironmentObject private var sessionState: SessionState

    var body: some View {
        Group {
            switch sessionState.status {
            case .checking:
                ProgressView("Getting things ready…")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(LeafbookColors.background)
            case .signedOut:
                SignInView()
            case .signedIn:
                MainTabView()
            }
        }
    }
}

#Preview {
    RootView()
        .environmentObject(SessionState(isPreview: true))
}
