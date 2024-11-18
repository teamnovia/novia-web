import { useEffect, useMemo, useRef, useState } from 'react';

type DropDownOption = {
  value: string;
  label: string;
  icon: React.ReactElement;
};

type DropDownProps = {
  setValue: (v: string) => void;
  value: string;
  options: DropDownOption[];
  align?: 'left' | 'right';
};

export const DropDown = ({ setValue, options, value, align = 'left' }: DropDownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Toggle dropdown open state
  const toggleDropdown = () => {
    setIsOpen(prevState => !prevState);
  };

  // Close dropdown
  const closeDropdown = () => {
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const selected = useMemo(() => {
    return options.find(o => o.value == value);
  }, [options, value]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        tabIndex={0}
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="btn md:w-[12em] btn-square flex items-center"
      >
        {selected?.icon && selected.icon}
        {selected?.label && <span className="hidden md:inline">{selected.label}</span>}
      </button>
      {isOpen && (
        <ul
          tabIndex={0}
          role="menu"
          className={`z-50 absolute ${align == 'left' ? 'left-0' : 'right-0'} dropdown-content border-primary border menu p-2 shadow-xl shadow-base-300 bg-base-100 rounded-box w-52`}
        >
          {options.map(o => (
            <li key={o.value}>
              <a
                href="#"
                role="menuitem"
                className="flex items-center"
                onClick={() => {
                  closeDropdown();
                  setValue(o.value);
                }}
              >
                {o.icon} {o.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
