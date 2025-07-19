
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export type AutocompleteOption = {
  value: string;
  label: string;
};

interface AutocompleteProps {
  options: AutocompleteOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allowCustomValue?: boolean;
}

export function Autocomplete({
  options,
  value,
  onChange,
  placeholder,
  className,
  allowCustomValue = false,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getLabelFromValue = useCallback((currentValue: string) => {
    if (allowCustomValue) {
      return currentValue;
    }
    return options.find(o => o.value === currentValue)?.label || '';
  }, [options, allowCustomValue]);

  const [inputValue, setInputValue] = useState(() => getLabelFromValue(value));

  useEffect(() => {
    setInputValue(getLabelFromValue(value));
  }, [value, getLabelFromValue]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    if (allowCustomValue) {
      onChange(newInputValue);
    }
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleSelectOption = (option: AutocompleteOption) => {
    onChange(option.value);
    setInputValue(getLabelFromValue(option.value));
    setIsOpen(false);
  };
  
  const handleInputBlur = () => {
     setTimeout(() => {
      if (!isOpen) {
        setInputValue(getLabelFromValue(value));
      }
    }, 200);
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setIsOpen(false);
      setInputValue(getLabelFromValue(value));
    }
  }, [value, getLabelFromValue]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <Input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleInputBlur}
        className="w-full"
      />
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
          <ScrollArea className="max-h-60">
            {filteredOptions.length > 0 ? (
              <ul className="p-1">
                {filteredOptions.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      className={cn(
                        'w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent',
                        { 'bg-accent': value === option.value && !allowCustomValue }
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectOption(option);
                      }}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-2 text-sm text-center text-muted-foreground">
                {allowCustomValue ? "Escribe para añadir un valor personalizado" : "No se encontraron resultados."}
              </p>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
