import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTravelContext, type Trip } from '../../context/globalContext';

const Trips = () => {
    const { trips, getTrips } = useTravelContext();
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            await getTrips();
            setLoading(false);
        };
        fetchData();
    }, [getTrips]);

    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return 'N/A';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <div className='flex flex-col gap-4 bg-white p-5 rounded-lg shadow-xl border border-gray-200 text-gray-800 min-h-24 w-full max-w-7xl mx-auto'>
            <div className='text-center font-serif text-shadow-lg text-3xl lg:text-4xl mb-6 text-primary'>
                All Trips
            </div>

            {loading ? (
                <div className='text-center py-8'>
                    <p className='text-gray-600'>Loading trips...</p>
                </div>
            ) : trips && trips.length > 0 ? (
                <div className='overflow-x-auto'>
                    <table className='min-w-full bg-white border border-gray-200 rounded-lg'>
                        <thead className='bg-primary text-white'>
                            <tr>
                                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider'>
                                    Destination
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider'>
                                    Start Date
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider'>
                                    End Date
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider'>
                                    Type
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider'>
                                    People
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider'>
                                    Budget
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider'>
                                    Status
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider'>
                                    Admin Feedback
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider'>
                                    Created
                                </th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-200'>
                            {trips.map((trip) => (
                                <tr 
                                    key={trip.id} 
                                    className='hover:bg-gray-50 transition-colors cursor-pointer'
                                    onClick={() => navigate(`/trips/${trip.id}`)}
                                >
                                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                                        {trip.destination || 'N/A'}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>
                                        {formatDate(trip.startDate)}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>
                                        {formatDate(trip.endDate)}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>
                                        {trip.tripType || 'N/A'}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>
                                        {trip.numberOfPeople || 'N/A'}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>
                                        {formatCurrency(trip.budget)}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            trip.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                            trip.status === 'DISAPPROVED' ? 'bg-red-100 text-red-800' :
                                            trip.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {trip.status || 'DRAFT'}
                                        </span>
                                    </td>
                                    <td className='px-6 py-4 text-sm text-gray-600 max-w-xs truncate' title={trip.adminFeedback || ''}>
                                        {trip.adminFeedback || '-'}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>
                                        {formatDate(trip.createdAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className='text-center py-12'>
                    <p className='text-xl text-gray-600 mb-4'>No trips yet</p>
                    <p className='text-gray-500 mb-6'>
                        To create a trip go to the{' '}
                        <Link 
                            to='/trip-generator' 
                            className='text-primary hover:text-secondary font-medium underline'
                        >
                            Trip Generator
                        </Link>{' '}
                        tab
                    </p>
                </div>
            )}
        </div>
    );
};

export default Trips;
