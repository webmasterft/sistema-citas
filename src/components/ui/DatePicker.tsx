"use client";

import React, { forwardRef } from "react";
import ReactDatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays } from "lucide-react";

registerLocale("es", es);

interface DatePickerProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  id?: string;
  required?: boolean;
}

export const DatePicker = ({
  selected,
  onChange,
  placeholderText = "Seleccionar fecha",
  className = "",
  minDate,
  maxDate,
  id,
  required
}: DatePickerProps) => {
  const CustomInput = forwardRef<HTMLButtonElement, any>(({ value, onClick }, ref) => (
    <button
      type="button"
      className={`flex h-[42px] w-full items-center justify-between rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm ring-offset-background placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-colors ${className}`}
      onClick={onClick}
      ref={ref}
      id={id}
    >
      <span className={value ? "text-slate-800" : "text-slate-400"}>
        {value || placeholderText}
      </span>
      <CalendarDays className="h-4 w-4 opacity-50 text-slate-500" />
    </button>
  ));

  CustomInput.displayName = "CustomInput";

  return (
    <div className="relative w-full datepicker-container">
      <ReactDatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="dd/MM/yyyy"
        locale="es"
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholderText}
        required={required}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        scrollableYearDropdown
        yearDropdownItemNumber={100}
        customInput={<CustomInput />}
        popperPlacement="bottom-start"
        popperClassName="z-[100]"
        calendarClassName="!bg-card !border-border !text-foreground"
        className="w-full"
      />
    </div>
  );
};
