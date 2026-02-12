//
//  RootView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct RootView: View {
    @EnvironmentObject private var sessionState: SessionState
    @StateObject private var tabRouter = TabRouter()

    var body: some View {
        Group {
            switch sessionState.status {
            case .checking:
                VStack(spacing: 20) {
                    LeafbookLogoView()
                        .frame(width: 120, height: 144)
                    ProgressView("Getting things ready…")
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(LeafbookColors.background)
            case .signedOut:
                SignInView()
            case .signedIn:
                MainTabView()
                    .environmentObject(tabRouter)
            }
        }
    }
}

#Preview {
    RootView()
        .environmentObject(SessionState(isPreview: true))
        .environmentObject(TabRouter())
}
