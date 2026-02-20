//
//  CalendarGridView.swift
//  Leafbook
//

import SwiftUI

struct CalendarGridView: View {
    @Binding var displayedMonth: Date
    let dotColors: [Date: [Color]]
    let selectedDay: Date?
    let onSelectDay: (Date) -> Void

    private let calendar = Calendar.current
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 0), count: 7)
    private let weekdaySymbols = Calendar.current.veryShortWeekdaySymbols

    var body: some View {
        VStack(spacing: 12) {
            monthHeader
            weekdayHeader
            dayGrid
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(LeafbookColors.card)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(LeafbookColors.foreground.opacity(0.08), lineWidth: 1)
        )
    }

    // MARK: - Month Header

    private var monthHeader: some View {
        HStack {
            Button {
                withAnimation { shiftMonth(by: -1) }
            } label: {
                Image(systemName: "chevron.up")
                    .font(.body.weight(.semibold))
                    .foregroundStyle(LeafbookColors.primary)
            }

            Spacer()

            Text(monthYearString)
                .font(.system(.title3, design: .serif).weight(.semibold))
                .foregroundStyle(LeafbookColors.foreground)

            Spacer()

            Button {
                withAnimation { shiftMonth(by: 1) }
            } label: {
                Image(systemName: "chevron.down")
                    .font(.body.weight(.semibold))
                    .foregroundStyle(canGoForward ? LeafbookColors.primary : LeafbookColors.muted)
            }
            .disabled(!canGoForward)
        }
    }

    // MARK: - Weekday Header

    private var weekdayHeader: some View {
        LazyVGrid(columns: columns, spacing: 0) {
            ForEach(Array(weekdaySymbols.enumerated()), id: \.offset) { _, symbol in
                Text(symbol)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(LeafbookColors.foreground.opacity(0.5))
                    .frame(maxWidth: .infinity)
            }
        }
    }

    // MARK: - Day Grid

    private var dayGrid: some View {
        let days = daysWithOverflow()
        return LazyVGrid(columns: columns, spacing: 6) {
            ForEach(Array(days.enumerated()), id: \.offset) { _, entry in
                dayCell(for: entry.date, isCurrentMonth: entry.isCurrentMonth)
            }
        }
    }

    private func dayCell(for date: Date, isCurrentMonth: Bool) -> some View {
        let dayNumber = calendar.component(.day, from: date)
        let isToday = calendar.isDateInToday(date)
        let isSelected = selectedDay.map { calendar.isDate($0, inSameDayAs: date) } ?? false
        let key = calendar.startOfDay(for: date)
        let colors = dotColors[key] ?? []

        return Button {
            onSelectDay(date)
        } label: {
            VStack(spacing: 2) {
                Text("\(dayNumber)")
                    .font(.system(.callout, design: .rounded).weight(isToday ? .bold : .regular))
                    .foregroundStyle(
                        isCurrentMonth
                            ? (isToday ? LeafbookColors.primary : LeafbookColors.foreground)
                            : LeafbookColors.foreground.opacity(0.25)
                    )
                    .frame(width: 30, height: 30)
                    .background(
                        Group {
                            if isSelected {
                                Circle().fill(LeafbookColors.primary.opacity(0.2))
                            } else if isToday {
                                Circle().stroke(LeafbookColors.primary, lineWidth: 1.5)
                            }
                        }
                    )

                HStack(spacing: 3) {
                    ForEach(Array(colors.prefix(4).enumerated()), id: \.offset) { _, color in
                        Circle()
                            .fill(color)
                            .frame(width: 5, height: 5)
                    }
                }
                .frame(height: 5)
                .opacity(isCurrentMonth ? 1 : 0.3)
            }
        }
        .buttonStyle(.plain)
        .frame(height: 44)
    }

    // MARK: - Helpers

    private struct DayEntry {
        let date: Date
        let isCurrentMonth: Bool
    }

    private func daysWithOverflow() -> [DayEntry] {
        guard let range = calendar.range(of: .day, in: .month, for: displayedMonth),
              let firstOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: displayedMonth))
        else { return [] }

        let weekdayOfFirst = calendar.component(.weekday, from: firstOfMonth)
        let leadingBlanks = (weekdayOfFirst - calendar.firstWeekday + 7) % 7

        var days: [DayEntry] = []

        // Leading overflow days from previous month
        for i in (0..<leadingBlanks).reversed() {
            if let date = calendar.date(byAdding: .day, value: -(i + 1), to: firstOfMonth) {
                days.append(DayEntry(date: date, isCurrentMonth: false))
            }
        }

        // Current month days
        for day in range {
            if let date = calendar.date(byAdding: .day, value: day - 1, to: firstOfMonth) {
                days.append(DayEntry(date: date, isCurrentMonth: true))
            }
        }

        // Trailing overflow days to fill the last week
        let remainder = days.count % 7
        if remainder > 0 {
            let trailingCount = 7 - remainder
            if let lastOfMonth = calendar.date(byAdding: .day, value: range.count - 1, to: firstOfMonth) {
                for i in 1...trailingCount {
                    if let date = calendar.date(byAdding: .day, value: i, to: lastOfMonth) {
                        days.append(DayEntry(date: date, isCurrentMonth: false))
                    }
                }
            }
        }

        // Add one extra trailing week
        let lastDate = days.last?.date ?? Date()
        for i in 1...7 {
            if let date = calendar.date(byAdding: .day, value: i, to: lastDate) {
                days.append(DayEntry(date: date, isCurrentMonth: false))
            }
        }

        // Add one extra leading week
        let firstDate = days.first?.date ?? Date()
        var leadingWeek: [DayEntry] = []
        for i in (1...7).reversed() {
            if let date = calendar.date(byAdding: .day, value: -i, to: firstDate) {
                leadingWeek.append(DayEntry(date: date, isCurrentMonth: false))
            }
        }
        days = leadingWeek + days

        return days
    }

    private var monthYearString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter.string(from: displayedMonth)
    }

    private func shiftMonth(by value: Int) {
        if let newMonth = calendar.date(byAdding: .month, value: value, to: displayedMonth) {
            displayedMonth = newMonth
        }
    }

    private var canGoForward: Bool {
        let currentMonth = calendar.dateComponents([.year, .month], from: Date())
        let displayed = calendar.dateComponents([.year, .month], from: displayedMonth)
        if let current = calendar.date(from: currentMonth),
           let shown = calendar.date(from: displayed) {
            return shown < current
        }
        return false
    }
}

#Preview {
    struct PreviewWrapper: View {
        @State private var month = Date()
        var body: some View {
            let today = Calendar.current.startOfDay(for: Date())
            let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today)!
            CalendarGridView(
                displayedMonth: $month,
                dotColors: [
                    today: [LeafbookColors.waterBlue, LeafbookColors.primary],
                    yesterday: [LeafbookColors.roseAccent]
                ],
                selectedDay: today,
                onSelectDay: { _ in }
            )
            .padding()
            .background(LeafbookColors.background)
        }
    }
    return PreviewWrapper()
}
