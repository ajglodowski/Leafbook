//
//  AuthViewModel.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import Combine
import Foundation

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var isLoading = false
    @Published var errorMessage: String?

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
