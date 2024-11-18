import { PlusIcon, ServerIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Input } from '../../components/Input';

type ServerListProps = {
  title: string;
  values: string[];
  setValues: React.Dispatch<React.SetStateAction<string[]>>;
  validate: (s: string) => boolean;
  placeholder?: string;
};

export function ServerList({ title, values, setValues, validate, placeholder }: ServerListProps) {
  const [inputValue, setInputValue] = useState('');

  return (
    <>
      <div className="flex flex-row">
        <h2 className="text-2xl mb-4 flex-grow">{title}</h2>
      </div>

      <div className="flex flex-col gap-4">
        {values.map(r => (
          <div key={r} className="flex flex-row gap-2 text-white items-center ">
            <ServerIcon className="w-6" />
            <div className="flex-grow">{r}</div>
            <button
              className="btn btn-ghost text-base-content"
              onClick={() => setValues(old => old.filter(o => o != r))}
            >
              <TrashIcon className="w-4 " />
            </button>
          </div>
        ))}
        <div className="flex flex-row gap-2 text-white">
          <Input
            className=" bg-base-300"
            placeholder={placeholder}
            value={inputValue}
            setValue={v => setInputValue(v)}
          />
          <button
            className="btn btn-ghost text-base-content"
            disabled={!inputValue || !validate(inputValue)}
            onClick={() => {
              setValues(old => [...old, inputValue]);
              setInputValue('');
            }}
          >
            <PlusIcon />
          </button>
        </div>
      </div>
    </>
  );
}
