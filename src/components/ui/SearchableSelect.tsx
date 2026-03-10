"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

interface Option {
  id: string;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  id?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar opción",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados",
  className = "",
  id,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  const filteredOptions = options.filter((opt) => {
    const searchTerms = search.toLowerCase();
    const labelMatch = (opt.label || "").toLowerCase().includes(searchTerms);
    const subLabelMatch = (opt.subLabel || "").toLowerCase().includes(searchTerms);
    return labelMatch || subLabelMatch;
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id={id}
        onClick={() => {
          console.log("SearchableSelect: click on Trigger");
          setIsOpen(!isOpen);
        }}
        className="flex h-[42px] w-full items-center justify-between rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm ring-offset-background placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col items-start truncate overflow-hidden pointer-events-none">
          <span className={selectedOption ? "text-slate-800 font-medium" : "text-slate-400"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.subLabel && (
            <span className="text-[10px] text-slate-500 leading-none">
              {selectedOption.subLabel}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-100 mt-1 w-full rounded-md border bg-card p-1 text-popover-foreground shadow-2xl outline-none animate-in fade-in zoom-in-95 duration-100 min-w-[200px]">
          <div className="flex items-center border-b px-2 pb-1 pt-0.5">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={inputRef}
              className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 text-slate-800"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="ml-auto rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto mt-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors ${
                    value === opt.id ? "bg-accent/50 text-accent-foreground" : ""
                  }`}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">{opt.label}</span>
                    {opt.subLabel && <span className="text-[10px] opacity-70">{opt.subLabel}</span>}
                  </div>
                  {value === opt.id && <Check className="ml-auto h-4 w-4" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
