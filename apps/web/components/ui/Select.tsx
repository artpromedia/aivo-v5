'use client';

import React from 'react';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  className?: string;
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
}

export function Select({ className = '', children, onValueChange, onChange, ...props }: SelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onValueChange) {
      onValueChange(e.target.value);
    }
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <select
      className={`flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onChange={handleChange}
      {...props}
    >
      {children}
    </select>
  );
}

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  className?: string;
  children: React.ReactNode;
}

export function SelectItem({ className = '', children, ...props }: SelectItemProps) {
  return (
    <option className={className} {...props}>
      {children}
    </option>
  );
}

// Compound Select components for more complex use cases
interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
}

export function SelectTrigger({ className = '', children }: SelectTriggerProps) {
  return (
    <div className={`flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ${className}`}>
      {children}
    </div>
  );
}

interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

export function SelectValue({ placeholder, children }: SelectValueProps) {
  return (
    <span className="text-slate-700">
      {children || <span className="text-slate-400">{placeholder}</span>}
    </span>
  );
}

interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
}

export function SelectContent({ className = '', children }: SelectContentProps) {
  return (
    <div className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${className}`}>
      {children}
    </div>
  );
}

export default Select;
