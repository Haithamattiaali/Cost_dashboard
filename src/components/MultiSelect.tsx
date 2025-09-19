import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  className?: string;
  disabled?: boolean;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select items...',
  maxItems = 4,
  className = '',
  disabled = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else if (value.length < maxItems) {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const getSelectedLabels = () => {
    return value.map(v => options.find(opt => opt.value === v)?.label || v);
  };

  const selectedLabels = getSelectedLabels();

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-between
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400 cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-[#9e1f63] focus:border-transparent`}
      >
        <div className="flex-1 flex flex-wrap gap-1 items-center min-h-[1.5rem]">
          {value.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            selectedLabels.map((label, index) => (
              <span
                key={value[index]}
                className="inline-flex items-center px-2 py-0.5 rounded text-sm bg-[#9e1f63] text-white"
              >
                <span className="max-w-[150px] truncate">{label}</span>
                {!disabled && (
                  <button
                    onClick={(e) => removeOption(value[index], e)}
                    className="ml-1 hover:bg-[#721548] rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))
          )}
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {value.length >= maxItems && (
            <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-200">
              Maximum {maxItems} items selected
            </div>
          )}
          {options.map(option => {
            const isSelected = value.includes(option.value);
            const isDisabled = !isSelected && value.length >= maxItems;

            return (
              <button
                key={option.value}
                onClick={() => !isDisabled && toggleOption(option.value)}
                disabled={isDisabled}
                className={`w-full px-3 py-2 text-left flex items-center justify-between
                  ${isSelected ? 'bg-pink-50 text-[#9e1f63]' : ''}
                  ${isDisabled ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
                  transition-colors`}
              >
                <span className="flex-1">{option.label}</span>
                {isSelected && <Check className="h-4 w-4 text-[#9e1f63]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}