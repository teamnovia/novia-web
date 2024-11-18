import { XMarkIcon } from '@heroicons/react/24/outline';
import { ReactElement } from 'react';

type InputProps = {
  className?: string;
  value: string;
  setValue: (value: string) => void;
  icon?: ReactElement;
  placeholder?: string;
  disabled?: boolean;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
};

export const Input = ({ className, value, setValue, icon, placeholder, disabled, onFocus, onBlur }: InputProps) => {
  return (
    <label
      className={`input bg-base-200 focus-within:border-primary focus-within:outline-0 flex flex-grow items-center gap-2 ${className}`}
    >
      <input
        type="text"
        onFocus={onFocus}
        onBlur={onBlur}
        className="flex-grow"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {value ? <XMarkIcon className="w-4 cursor-pointer" onClick={() => setValue('')} /> : icon}
    </label>
  );
};
