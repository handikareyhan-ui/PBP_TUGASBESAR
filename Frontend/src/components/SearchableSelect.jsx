import React, { useState, useRef, useEffect } from 'react';

const SearchableSelect = ({ options = [], value = '', onChange, placeholder = 'Pilih...', disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search query when value changes
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearchQuery(''); // clear on focus to show all options
    }
  };

  const handleOptionClick = (option) => {
    onChange(option);
    setSearchQuery(option);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          value={searchQuery}
          onFocus={handleInputFocus}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full px-3 py-2 bg-[#eff4ff] border border-outline-variant rounded-xl outline-none pr-8 text-xs transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'focus:border-primary'
          }`}
        />
        <span
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base cursor-pointer select-none"
        >
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-outline-variant rounded-xl shadow-lg max-h-48 overflow-y-auto z-50 py-1">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-on-surface-variant/60 text-center">
              Tidak ada hasil ditemukan
            </div>
          ) : (
            filteredOptions.map((option, idx) => (
              <div
                key={idx}
                onClick={() => handleOptionClick(option)}
                className={`px-3 py-2 text-xs cursor-pointer transition-colors ${
                  option === value
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'hover:bg-slate-50 text-primary'
                }`}
              >
                {option}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
