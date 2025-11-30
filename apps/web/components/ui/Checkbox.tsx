'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  className?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ 
  className = '', 
  checked,
  onCheckedChange,
  onChange,
  ...props 
}: CheckboxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) {
      onCheckedChange(e.target.checked);
    }
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <label className={`relative inline-flex items-center cursor-pointer ${className}`}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={handleChange}
        {...props}
      />
      <div className="w-4 h-4 border border-slate-300 rounded peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors flex items-center justify-center">
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
    </label>
  );
}

export default Checkbox;
