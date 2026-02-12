//
//  AuthViewModel.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Foundation
import Observation

@Observable
@MainActor
final class AuthViewModel {
    var email = ""
    var password = ""
    var isLoading = false
    var errorMessage: String?

    private let service: SupabaseService

    init(service: SupabaseService = .shared) {
        self.service = service
    }

    func signIn() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            try await service.signIn(email: email, password: password)
        } catch {
            errorMessage = "We couldn't sign you in. Check your email and password."
        }
    }
}
