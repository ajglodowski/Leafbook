//
//  CareLogButton.swift
//  Leafbook
//
//  Created by AJ Glodowski on 1/31/26.
//

import SwiftUI

struct CareLogButton: View {
    let title: String
    let systemImage: String
    let tint: Color
    let onLog: (Date) -> Void

    @State private var showingDatePicker = false
    @State private var selectedDate: Date = Self.normalizedDate(Date())

    var body: some View {
        let buttonHeight: CGFloat = 30

        HStack(spacing: 0) {
            Button {
                log(daysAgo: 0)
            } label: {
                Label(title, systemImage: systemImage)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .frame(height: buttonHeight)
            }
            .buttonStyle(.plain)

            Rectangle()
                .fill(Color.white.opacity(0.25))
                .frame(width: 1, height: buttonHeight)

            Menu {
                Button("Today") {
                    log(daysAgo: 0)
                }
                Button("Yesterday") {
                    log(daysAgo: 1)
                }
                Button("2 days ago") {
                    log(daysAgo: 2)
                }
                Button("3 days ago") {
                    log(daysAgo: 3)
                }
                Divider()
                Button("1 week ago") {
                    log(daysAgo: 7)
                }
                Divider()
                Button("Pick a date...") {
                    selectedDate = Self.normalizedDate(Date())
                    showingDatePicker = true
                }
            } label: {
                Image(systemName: "chevron.down")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(width: 28, height: buttonHeight)
            }
            .buttonStyle(.plain)
        }
        .background(tint)
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .sheet(isPresented: $showingDatePicker) {
            CareLogDatePickerSheet(
                title: title,
                selectedDate: $selectedDate,
                onSave: {
                    onLog(Self.normalizedDate(selectedDate))
                    showingDatePicker = false
                },
                onCancel: {
                    showingDatePicker = false
                }
            )
        }
    }

    private func log(daysAgo: Int) {
        let baseDate = Self.normalizedDate(Date())
        let date = Calendar.current.date(byAdding: .day, value: -daysAgo, to: baseDate) ?? baseDate
        onLog(date)
    }

    private static func normalizedDate(_ date: Date) -> Date {
        let calendar = Calendar.current
        return calendar.date(bySettingHour: 12, minute: 0, second: 0, of: date) ?? date
    }
}

private struct CareLogDatePickerSheet: View {
    let title: String
    @Binding var selectedDate: Date
    let onSave: () -> Void
    let onCancel: () -> Void

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Text("When did you \(title.lowercased()) this plant?")
                    .font(.headline)
                    .foregroundStyle(LeafbookColors.foreground)

                DatePicker(
                    "Date",
                    selection: $selectedDate,
                    in: ...Date(),
                    displayedComponents: [.date]
                )
                .datePickerStyle(.graphical)
                .labelsHidden()

                Spacer()
            }
            .padding()
            .navigationTitle("Pick a date")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        onCancel()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        onSave()
                    }
                }
            }
        }
    }
}

#Preview {
    CareLogButton(
        title: "Water",
        systemImage: "drop.fill",
        tint: LeafbookColors.waterBlue,
        onLog: { _ in }
    )
    .padding()
    .background(LeafbookColors.background)
}
