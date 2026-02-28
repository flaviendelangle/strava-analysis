import {
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  isSameMonth,
  isSameQuarter,
  isSameWeek,
  isSameYear,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { enGB } from "date-fns/locale/en-GB";

import { SlicePrecision } from "~/hooks/useTimeSlices";

const LOCALE_OPTIONS = { locale: enGB };

export function startOf(date: Date, precision: SlicePrecision): Date {
  switch (precision) {
    case "year":
      return startOfYear(date);
    case "quarter":
      return startOfQuarter(date);
    case "month":
      return startOfMonth(date);
    case "week":
      return startOfWeek(date, LOCALE_OPTIONS);
  }
}

export function endOf(date: Date, precision: SlicePrecision): Date {
  switch (precision) {
    case "year":
      return endOfYear(date);
    case "quarter":
      return endOfQuarter(date);
    case "month":
      return endOfMonth(date);
    case "week":
      return endOfWeek(date, LOCALE_OPTIONS);
  }
}

export function addUnit(
  date: Date,
  amount: number,
  precision: SlicePrecision,
): Date {
  switch (precision) {
    case "year":
      return addYears(date, amount);
    case "quarter":
      return addQuarters(date, amount);
    case "month":
      return addMonths(date, amount);
    case "week":
      return addWeeks(date, amount);
  }
}

export function isSameUnit(
  a: Date,
  b: Date,
  precision: SlicePrecision,
): boolean {
  switch (precision) {
    case "year":
      return isSameYear(a, b);
    case "quarter":
      return isSameQuarter(a, b);
    case "month":
      return isSameMonth(a, b);
    case "week":
      return isSameWeek(a, b, LOCALE_OPTIONS);
  }
}
