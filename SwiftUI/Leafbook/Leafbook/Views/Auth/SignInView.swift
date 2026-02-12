//
//  SignInView.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/26/26.
//

import SwiftUI

struct SignInView: View {
    @State private var viewModel = AuthViewModel()

    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 16) {
                LeafbookLogoView()
                    .frame(width: 120, height: 144)

                VStack(spacing: 8) {
                    Text("Leafbook")
                        .font(.largeTitle.weight(.semibold))
                    Text("Welcome back. Your plants missed you.")
                        .font(.subheadline)
                        .foregroundStyle(LeafbookColors.foreground.opacity(0.7))
                }
            }

            VStack(spacing: 16) {
                TextField("Email", text: $viewModel.email)
                    #if os(iOS)
                    .textInputAutocapitalization(.never)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    #endif
                    .padding()
                    .background(LeafbookColors.card)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                SecureField("Password", text: $viewModel.password)
                    #if os(iOS)
                    .textContentType(.password)
                    #endif
                    .padding()
                    .background(LeafbookColors.card)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }

            if let message = viewModel.errorMessage {
                Text(message)
                    .font(.footnote)
                    .foregroundStyle(Color.red)
            }

            Button {
                Task { await viewModel.signIn() }
            } label: {
                Text(viewModel.isLoading ? "Signing in…" : "Sign In")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(LeafbookColors.primary)
                    .foregroundStyle(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .disabled(viewModel.isLoading || viewModel.email.isEmpty || viewModel.password.isEmpty)

            Spacer()
        }
        .padding()
        .frame(maxWidth: 420)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(LeafbookColors.background)
    }
}

#Preview {
    SignInView()
}
