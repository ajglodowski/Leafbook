/**
 * Watering Schedule Analysis Library
 * 
 * Analyzes user watering patterns to detect when their actual behavior
 * differs significantly from their set schedule, using IQR-based outlier
 * detection to filter out irregular events (vacations, forgotten waterings, etc.)
 */

export interface WateringEvent {
  event_date: string;
}

export interface ScheduleAnalysisResult {
  /** Whether a schedule adjustment should be suggested */
  shouldSuggest: boolean;
  /** The suggested new interval in days (null if no suggestion) */
  suggestedDays: number | null;
  /** Confidence score 0-100 based on consistency of watering pattern */
  confidence: number;
  /** The actual median interval detected from user behavior */
  detectedMedianInterval: number | null;
  /** Number of data points used after outlier removal */
  dataPointsUsed: number;
}

/**
 * Calculate the number of days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date1.getTime() - date2.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate the median of an array of numbers
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate Q1 (25th percentile) of an array of numbers
 */
function q1(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const lowerHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  return median(lowerHalf);
}

/**
 * Calculate Q3 (75th percentile) of an array of numbers
 */
function q3(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const upperHalf = sorted.slice(Math.ceil(sorted.length / 2));
  return median(upperHalf);
}

/**
 * Remove outliers from an array using IQR method
 * Outliers are values < Q1 - 1.5*IQR or > Q3 + 1.5*IQR
 */
function removeOutliersIQR(values: number[]): number[] {
  if (values.length < 4) {
    // Not enough data points to reliably detect outliers
    return values;
  }

  const q1Val = q1(values);
  const q3Val = q3(values);
  const iqr = q3Val - q1Val;
  
  // If IQR is 0, all values are very similar - no outliers
  if (iqr === 0) {
    return values;
  }

  const lowerBound = q1Val - 1.5 * iqr;
  const upperBound = q3Val + 1.5 * iqr;

  return values.filter(val => val >= lowerBound && val <= upperBound);
}

/**
 * Calculate standard deviation of an array of numbers
 */
function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Analyze watering schedule based on historical events
 * 
 * @param events - Array of watering events, sorted by date (most recent first)
 * @param currentScheduleDays - The currently set watering interval in days
 * @param minEventsRequired - Minimum events needed to make a suggestion (default 5)
 * @param significantDifference - Minimum difference in days to trigger suggestion (default 2)
 * @returns Analysis result with suggestion details
 */
export function analyzeWateringSchedule(
  events: WateringEvent[],
  currentScheduleDays: number,
  minEventsRequired: number = 5,
  significantDifference: number = 2
): ScheduleAnalysisResult {
  // Need enough events to detect a pattern
  if (events.length < minEventsRequired) {
    return {
      shouldSuggest: false,
      suggestedDays: null,
      confidence: 0,
      detectedMedianInterval: null,
      dataPointsUsed: 0,
    };
  }

  // Calculate intervals between consecutive waterings
  // Events should be sorted most recent first
  const intervals: number[] = [];
  for (let i = 0; i < events.length - 1; i++) {
    const current = new Date(events[i].event_date);
    const previous = new Date(events[i + 1].event_date);
    const days = daysBetween(current, previous);
    
    // Only include positive, reasonable intervals (1-90 days)
    if (days > 0 && days <= 90) {
      intervals.push(days);
    }
  }

  // Need enough valid intervals
  if (intervals.length < minEventsRequired - 1) {
    return {
      shouldSuggest: false,
      suggestedDays: null,
      confidence: 0,
      detectedMedianInterval: null,
      dataPointsUsed: intervals.length,
    };
  }

  // Remove outliers using IQR method
  const filteredIntervals = removeOutliersIQR(intervals);

  // Need enough data points after outlier removal
  if (filteredIntervals.length < 3) {
    return {
      shouldSuggest: false,
      suggestedDays: null,
      confidence: 0,
      detectedMedianInterval: null,
      dataPointsUsed: filteredIntervals.length,
    };
  }

  // Calculate median of filtered intervals
  const medianInterval = Math.round(median(filteredIntervals));

  // Check if median differs significantly from current schedule
  const difference = Math.abs(medianInterval - currentScheduleDays);

  if (difference >= significantDifference) {
    // Calculate confidence based on consistency (lower std dev = higher confidence)
    const stdDev = standardDeviation(filteredIntervals);
    
    // Confidence formula:
    // - Starts at 100
    // - Decreases with standard deviation (multiply by 8 for sensitivity)
    // - Higher with more data points (bonus up to 10 points)
    // - Clamped between 0 and 100
    const dataPointBonus = Math.min(10, filteredIntervals.length);
    const rawConfidence = 100 - (stdDev * 8) + dataPointBonus;
    const confidence = Math.max(0, Math.min(100, Math.round(rawConfidence)));

    return {
      shouldSuggest: true,
      suggestedDays: medianInterval,
      confidence,
      detectedMedianInterval: medianInterval,
      dataPointsUsed: filteredIntervals.length,
    };
  }

  // No significant difference - schedule matches behavior
  return {
    shouldSuggest: false,
    suggestedDays: null,
    confidence: 0,
    detectedMedianInterval: medianInterval,
    dataPointsUsed: filteredIntervals.length,
  };
}

/**
 * Format a schedule suggestion as a user-friendly message
 */
export function formatScheduleSuggestion(
  currentDays: number,
  suggestedDays: number,
  confidence: number
): string {
  const direction = suggestedDays < currentDays ? "more often" : "less often";
  const diff = Math.abs(suggestedDays - currentDays);
  
  if (confidence >= 80) {
    return `You consistently water ${direction} than your ${currentDays}-day schedule. Consider changing to every ${suggestedDays} days.`;
  } else if (confidence >= 60) {
    return `Your watering pattern suggests every ${suggestedDays} days might work better than ${currentDays} days.`;
  } else {
    return `You might prefer watering every ${suggestedDays} days instead of ${currentDays} days, but your pattern varies.`;
  }
}
