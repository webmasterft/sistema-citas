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
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${className}`}
      onClick={onClick}
      ref={ref}
      id={id}
    >
      <span className={value ? "text-foreground" : "text-muted-foreground"}>
        {value || placeholderText}
      </span>
      <CalendarDays className="h-4 w-4 opacity-50" />
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
        customInput={<CustomInput />}
        popperPlacement="bottom-start"
        popperClassName="z-[100]"
        calendarClassName="!bg-card !border-border !text-foreground"
        className="w-full"
      />
    </div>
  );
};
