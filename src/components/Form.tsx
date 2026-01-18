import { useState } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { FaPlus } from 'react-icons/fa';
import { MdError } from 'react-icons/md';
import 'react-datepicker/dist/react-datepicker.module.css';
import { useTravelContext } from '../context/globalContext';
import { incomeCategories, expenseCategories } from '../utils/utils';
import Notification from './Notifications';

interface FormData {
    title: string;
    amount: string;
    date: Date | null;
    category: string;
    description: string;
}

interface FormErrors {
    title?: string;
    amount?: string;
    date?: string;
    category?: string;
}

interface FormProps {
    type: string;
    onSubmit: (data: FormData) => void;
}

const Form: React.FC<FormProps> = ({ type, onSubmit }) => {
    const { tripsError, successTrips } = useTravelContext();
    const [formData, setFormData] = useState<FormData>({
        title: '',
        amount: '',
        date: null,
        category: '',
        description: ''
    });
    const [formError, setErrors] = useState<FormErrors>({});

    const transaction = type.toLowerCase();
    const categoryOptions = transaction === 'income' ? incomeCategories : expenseCategories;
    const { title, amount, date, category, description } = formData;

    const handleForm = (name: keyof FormData, value: string | Date | null) => {
        setFormData({ ...formData, [name]: value });
    };

    const validate = (): FormErrors => {
        const formError: FormErrors = {};
        if (!formData.title) {
            formError.title = 'Title is required';
        }

        if (!formData.amount) {
            formError.amount = 'Amount is required';
        }

        if (Number(formData.amount) < 0) {
            formError.amount = 'Amount cannot be negative';
        }

        if (!formData.date) {
            formError.date = 'Date is required';
        } else if (!isValidDate(format(formData.date, 'dd/MM/yyyy'))) {
            formError.date = 'Date is invalid';
        }

        if (!formData.category) {
            formError.category = 'Category is required';
        }

        return formError;
    };

    const isValidDate = (dateString: string): boolean => {
        const dateFormat = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

        if (!dateString.match(dateFormat)) return false;

        const parts = dateString.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        if (year < 1000 || year > 3000 || month === 0 || month > 12) return false;

        if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
            if (month === 2) {
                return day > 0 && day <= 29;
            }
        }

        const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return day > 0 && day <= monthLengths[month - 1];
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validate();
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length) {
            return;
        }

        onSubmit(formData);

        setFormData({
            title: '',
            amount: '',
            date: null,
            category: '',
            description: ''
        });
    };

    return (
        <div className='order-2 md:order-1 bg-white p-5 rounded-lg shadow-xl border border-gray-200 text-gray-800'>
            <form onSubmit={handleSubmit} className='px-5 flex flex-col justify-center'>
                <label htmlFor='name' className='block mb-2 text-sm font-medium text-gray-700'>
                    *Title
                </label>
                <input
                    type='text'
                    value={title}
                    name='title'
                    placeholder={`${type} type`}
                    className='p-1 rounded-md shadow-md border-2 border-secondary focus:ring-2 focus:ring-secondary focus:outline-none'
                    onChange={(e) => handleForm('title', e.target.value)}
                />
                {formError.title && (
                    <div className='flex items-center bg-gray-100 rounded-md mt-2 p-1 border border-gray-300 shadow-md'>
                        <MdError className='mr-2 h-5 w-5' color={'#b30404'} />
                        <span>{formError.title}</span>
                    </div>
                )}
                <label htmlFor='name' className='block my-2 text-sm font-medium text-gray-700'>
                    *Amount
                </label>
                <input
                    type='number'
                    value={amount}
                    inputMode='numeric'
                    pattern='[0-9]*'
                    name='amount'
                    placeholder='0'
                    className='p-1 rounded-md shadow-md border-2 border-secondary focus:ring-2 focus:ring-secondary focus:outline-none'
                    onChange={(e) => handleForm('amount', e.target.value)}
                />
                {formError.amount && (
                    <div className='flex items-center bg-gray-100 rounded-md mt-2 p-1 border border-gray-300 shadow-md'>
                        <MdError className='mr-2 h-5 w-5' color={'#b30404'} />
                        <span>{formError.amount}</span>
                    </div>
                )}
                <label htmlFor='name' className='block my-2 text-sm font-medium text-gray-700'>
                    *Date
                </label>
                <DatePicker
                    id='date'
                    placeholderText='Enter a date'
                    selected={date}
                    dateFormat='dd/MM/yyyy'
                    className='p-1 rounded-md shadow-md border-2 border-secondary focus:ring-2 focus:ring-secondary focus:outline-none w-full'
                    onChange={(date: Date | null) => {
                        handleForm('date', date);
                    }}
                />
                {formError.date && (
                    <div className='flex items-center bg-gray-100 rounded-md mt-2 p-1 border border-gray-300 shadow-md'>
                        <MdError className='mr-2 h-5 w-5' color={'#b30404'} />
                        <span>{formError.date}</span>
                    </div>
                )}
                <label htmlFor='name' className='block my-2 text-sm font-medium text-gray-700'>
                    *Category
                </label>
                <select
                    required
                    value={category}
                    name='category'
                    id='category'
                    className='p-1 rounded-md shadow-md border-2 border-secondary focus:ring-2 focus:ring-secondary focus:outline-none'
                    onChange={(e) => handleForm('category', e.target.value)}
                >
                    <option value='' disabled>
                        Select Option
                    </option>
                    {categoryOptions.map((category) => (
                        <option key={category.value} value={category.label}>
                            {category.label}
                        </option>
                    ))}
                </select>
                {formError.category && (
                    <div className='flex items-center bg-gray-100 rounded-md mt-2 p-1 border border-gray-300 shadow-md'>
                        <MdError className='mr-2 h-5 w-5' color={'#b30404'} />
                        <span>{formError.category}</span>
                    </div>
                )}
                <label htmlFor='description' className='my-2'>
                    Description (optional)
                </label>
                <textarea
                    id='description'
                    name='description'
                    value={description}
                    className='h-[100px] p-1 rounded-md shadow-md border-2 border-secondary focus:ring-2 focus:ring-secondary focus:outline-none'
                    placeholder='Write your description here...'
                    onChange={(e) => handleForm('description', e.target.value)}
                ></textarea>
                <button
                    type='submit'
                    className='mt-5 bg-secondary hover:bg-secondary-light text-white font-bold py-2 px-2 rounded flex justify-center items-center gap-2 transition-colors'
                >
                    <FaPlus /> Add {transaction}
                </button>
                <Notification success={successTrips} error={tripsError} />
                <div className='my-2 text-md'>* - field is required</div>
            </form>
        </div>
    );
};

export default Form;
