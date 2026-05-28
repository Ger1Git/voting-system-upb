interface SelectProps {
    label?: string;
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: Array<{ value: string | number; label: string }>;
    placeholder?: string;
    className?: string;
}

const Select: React.FC<SelectProps> = ({ 
    label, 
    name, 
    value, 
    onChange, 
    options, 
    placeholder = 'Select an option',
    className = ''
}) => {
    return (
        <div>
            {label && (
                <label htmlFor={name} className='block mb-2 text-sm font-medium text-gray-900'>
                    {label}
                </label>
            )}
            <div className='flex items-center mb-4 p-1 rounded-md shadow-md bg-white w-full border border-gray-200 focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary'>
                <select
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`p-1 border-0 w-full rounded-md focus:ring-0 focus:outline-none text-gray-900 cursor-pointer ${className}`}
                >
                    {placeholder && <option value='' className='text-gray-400'>{placeholder}</option>}
                    {options.map((option, index) => (
                        <option 
                            key={index} 
                            value={option.value}
                            className='py-2'
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default Select;
