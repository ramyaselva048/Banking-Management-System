import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface TypeableSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  allowCustom?: boolean;
}

export const TypeableSelect: React.FC<TypeableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Type or select...',
  required = false,
  className = '',
  allowCustom = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayValue = isEditing
    ? inputValue
    : selectedOption
    ? selectedOption.label
    : value !== undefined && value !== null
    ? String(value)
    : '';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = isEditing && inputValue.trim() !== ''
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
          String(opt.value).toLowerCase().includes(inputValue.toLowerCase())
      )
    : options;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    setIsEditing(true);
    setIsOpen(true);

    const exactMatch = options.find(
      (opt) =>
        opt.label.toLowerCase() === text.trim().toLowerCase() ||
        String(opt.value).toLowerCase() === text.trim().toLowerCase()
    );

    if (exactMatch) {
      onChange(String(exactMatch.value));
    } else if (allowCustom) {
      onChange(text);
    }
  };

  const handleSelectOption = (opt: SelectOption) => {
    onChange(String(opt.value));
    setInputValue(opt.label);
    setIsEditing(false);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isOpen && filteredOptions.length > 0) {
      const exact = filteredOptions.find(
        (opt) =>
          opt.label.toLowerCase() === inputValue.trim().toLowerCase() ||
          String(opt.value).toLowerCase() === inputValue.trim().toLowerCase()
      );
      const target = exact || (!allowCustom ? filteredOptions[0] : null);
      if (target) {
        e.preventDefault();
        handleSelectOption(target);
      } else {
        setIsOpen(false);
        setIsEditing(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsEditing(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          required={required}
          value={displayValue}
          placeholder={placeholder}
          onFocus={() => {
            setInputValue(selectedOption ? selectedOption.label : String(value || ''));
            setIsOpen(true);
          }}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={
            className ||
            'w-full px-3 py-2 pr-8 rounded-lg border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
          }
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            if (!isOpen) {
              setIsEditing(false);
              setIsOpen(true);
            } else {
              setIsOpen(false);
            }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1 text-xs">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  type="button"
                  key={`${opt.value}-${opt.label}`}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full text-left px-3 py-2 transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-slate-400 text-[11px]">
              {allowCustom && inputValue.trim()
                ? `Use custom value: "${inputValue.trim()}"`
                : 'No matching options'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
