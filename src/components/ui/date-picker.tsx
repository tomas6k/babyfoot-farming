"use client"

import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface DatePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  placeholder?: string
}

export function DatePicker({ date, setDate, placeholder = "Sélectionner une date" }: DatePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      setDate(new Date(value));
    } else {
      setDate(undefined);
    }
  };

  return (
    <input
      type="date"
      className="px-3 py-2 border rounded-md"
      value={date ? format(date, "yyyy-MM-dd") : ""}
      onChange={handleChange}
      placeholder={placeholder}
    />
  )
} 