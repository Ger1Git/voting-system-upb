import React, { useState } from 'react';
import { format } from 'date-fns';
import { FaPlane, FaLocationDot, FaCalendarDays, FaUsers } from 'react-icons/fa6';
import { ImBin } from 'react-icons/im';
import { FaEdit } from 'react-icons/fa';
import { useTravelContext } from '../context/globalContext';

interface TripItemProps {
    _id: string;
    destination: string;
    startDate: Date;
    endDate: Date;
    numberOfPeople: number;
    tripType: string;
    budget?: number;
}

const TripItem: React.FC<TripItemProps> = ({ 
    _id, 
    destination, 
    startDate, 
    endDate, 
    numberOfPeople, 
    tripType, 
    budget 
}) => {
    const { deleteTrip } = useTravelContext();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        try {
            await deleteTrip(_id);
        } catch (error) {
            console.error('Failed to delete trip:', error);
        }
    };

    return (
        <div className='flex justify-between items-center gap-4 p-4 border-2 rounded-md shadow-md border-gray-200 bg-white hover:shadow-lg transition-shadow'>
            <div className='flex gap-3 items-center grow'>
                <FaPlane size={30} className='text-primary' />
                <div className='flex flex-col gap-2'>
                    <div className='flex items-center gap-2'>
                        <FaLocationDot className='text-secondary' />
                        <span className='font-semibold text-lg'>{destination}</span>
                        <span className='text-sm text-gray-500'>({tripType})</span>
                    </div>
                    <div className='flex gap-4 text-sm text-gray-600'>
                        <div className='flex items-center gap-1'>
                            <FaCalendarDays />
                            {format(new Date(startDate), 'dd/MM/yyyy')} - {format(new Date(endDate), 'dd/MM/yyyy')}
                        </div>
                        <div className='flex items-center gap-1'>
                            <FaUsers />
                            {numberOfPeople} {numberOfPeople === 1 ? 'person' : 'people'}
                        </div>
                        {budget && (
                            <div className='flex items-center gap-1 text-green-600 font-medium'>
                                Budget: ${budget}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className={`relative transition-transform duration-300 flex gap-3 ${isDeleting ? 'transform -translate-x-20' : ''}`}>
                <FaEdit
                    size={20}
                    className={`transition duration-300 cursor-pointer hover:text-secondary ${
                        isDeleting ? 'opacity-0 translate-x-10 cursor-default' : ''
                    }`}
                />
                <ImBin
                    size={20}
                    className={`transition duration-300 cursor-pointer hover:text-red-500 ${
                        isDeleting ? 'cursor-default' : ''
                    }`}
                    onClick={() => setIsDeleting(true)}
                />
                {isDeleting && (
                    <div className='flex flex-col items-center gap-1 absolute -top-full left-[130%]'>
                        <span className='text-sm whitespace-nowrap'>Delete trip?</span>
                        <div className='flex items-center gap-2'>
                            <button
                                className='bg-red-500 hover:bg-red-600 text-white font-bold px-2 py-1 rounded text-sm'
                                onClick={handleDelete}
                            >
                                Yes
                            </button>
                            <button 
                                className='bg-gray-500 hover:bg-gray-600 text-white font-bold px-2 py-1 rounded text-sm' 
                                onClick={() => setIsDeleting(false)}
                            >
                                No
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TripItem;
