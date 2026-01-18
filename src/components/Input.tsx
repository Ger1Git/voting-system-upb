import React from 'react';

interface InputProps {
    label?: string;
    type: string;
    name: string;
    value: string;
    placeholder: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, type, name, value, placeholder, icon, onChange }) => {
    return (
        <div className="w-full flex flex-col">
            {label && (
                <label htmlFor={name} className='block mb-2 text-sm font-medium text-gray-900'>
                    {label}
                </label>
            )}
            <div className='flex items-center mb-4 p-1 rounded-md shadow-md bg-white w-full border border-gray-200 focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary'>
                {icon && <div className='mx-2 text-gray-700'>{icon}</div>}
                <input
                    type={type}
                    value={value}
                    name={name}
                    placeholder={placeholder}
                    className='p-1 border-0 w-full rounded-md focus:ring-0 focus:outline-none text-gray-900'
                    onChange={onChange}
                />
            </div>
        </div>
    );
};

export default Input;
