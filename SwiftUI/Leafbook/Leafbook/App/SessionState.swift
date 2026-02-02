//
//  SessionState.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Combine
import Foundation
import Supabase

@MainActor
final class SessionState: ObservableObject {
    enum Status: Equatable {
        case checking
        case signedOut
        case signedIn(userId: String)
    }

    @Published private(set) var status: Status = .checking

    private let service: SupabaseService
    private var authTask: Task<Void, Never>?

    init(service: SupabaseService = .shared, isPreview: Bool = false) {
        self.service = service

        if isPreview {
            status = .signedIn(userId: "72c1a368-879f-4506-9464-beb8fc18bab5")
        } else {
            startListening()
        }
    }

    deinit {
        authTask?.cancel()
    }

    func signOut() async {
        do {
            try await service.signOut()
        } catch {
            print("SessionState: signOut failed: \(error)")
            // Keep the existing state; UI can surface a toast later if needed.
        }
    }

    private func startListening() {
        authTask?.cancel()
        authTask = Task { [weak self] in
            guard let self else { return }
            do {
                let session = try await service.client.auth.session
                updateSession(session)
            } catch {
                print("SessionState: failed to get auth session: \(error)")
                status = .signedOut
            }

            for await (_, session) in await service.client.auth.authStateChanges {
                updateSession(session)
            }
        }
    }

    private func updateSession(_ session: Session?) {
        guard let session else {
            status = .signedOut
            return
        }

        if session.isExpired {
            status = .signedOut
            return
        }

        status = .signedIn(userId: session.user.id.uuidString)
    }
}
