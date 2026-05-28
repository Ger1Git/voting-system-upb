import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.module.css';
import { FaCalendarAlt } from 'react-icons/fa';

interface DateInputProps {
    label?: string;
    name: string;
    selected: Date | null;
    onChange: (date: Date | null) => void;
    placeholder?: string;
    minDate?: Date;
    maxDate?: Date;
    dateFormat?: string;
}

const DateInput: React.FC<DateInputProps> = ({
    label,
    name,
    selected,
    onChange,
    placeholder = 'Select date',
    minDate,
    maxDate,
    dateFormat = 'dd/MM/yyyy'
}) => {
    return (
        <div>
            {label && (
                <label htmlFor={name} className='block mb-2 text-sm font-medium text-gray-900'>
                    {label}
                </label>
            )}
            <div className='flex items-center mb-4 p-1 rounded-md shadow-md bg-white w-full border border-gray-200 focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary'>
                <FaCalendarAlt className='mx-2 text-gray-700' />
                <DatePicker
                    id={name}
                    name={name}
                    selected={selected}
                    onChange={onChange}
                    minDate={minDate}
                    maxDate={maxDate}
                    dateFormat={dateFormat}
                    placeholderText={placeholder}
                    className='p-1 border-0 w-full rounded-md focus:ring-0 focus:outline-none text-gray-900'
                />
            </div>
        </div>
    );
};

export default DateInput;
