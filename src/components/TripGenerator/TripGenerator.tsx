import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaUsers, FaDollarSign } from 'react-icons/fa';
import { MdError, MdCheckCircle } from 'react-icons/md';
import Input from '../Input';
import Select from '../Select';
import DateInput from '../DateInput';
import useRequestWithAuth from '../../hooks/useRequestWithAuth';

const TripGenerator = () => {
    const { request } = useRequestWithAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        startCity: '',
        destinationCity: '',
        stops: '',
        startDate: null as Date | null,
        endDate: null as Date | null,
        passengerCount: '',
        budget: '',
        tripType: '',
        preferences: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const tripTypes = [
        { value: 'adventure', label: 'Adventure' },
        { value: 'relaxation', label: 'Relaxation' },
        { value: 'cultural', label: 'Cultural' },
        { value: 'family', label: 'Family' },
        { value: 'romantic', label: 'Romantic' },
        { value: 'business', label: 'Business' }
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleDateChange = (name: string, date: Date | null) => {
        setFormData({ ...formData, [name]: date });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (!formData.startCity || !formData.destinationCity || !formData.startDate || !formData.endDate || !formData.passengerCount) {
            setError('Please fill in all required fields');
            setLoading(false);
            return;
        }

        if (formData.startDate >= formData.endDate) {
            setError('End date must be after start date');
            setLoading(false);
            return;
        }

        // Calculate number of days
        const numberOfDays = Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (numberOfDays <= 0) {
            setError('Invalid date range');
            setLoading(false);
            return;
        }

        // Parse stops (comma-separated)
        const stopsList = formData.stops
            ? formData.stops.split(',').map(s => s.trim()).filter(s => s.length > 0)
            : [];

        // Build desired activities from tripType and preferences
        const desiredActivities: string[] = [];
        if (formData.tripType) {
            desiredActivities.push(formData.tripType);
        }
        if (formData.preferences) {
            // Try to parse preferences as comma-separated activities, or add as single activity
            const prefActivities = formData.preferences.split(',').map(s => s.trim()).filter(s => s.length > 0);
            desiredActivities.push(...prefActivities);
        }

        const requestBody = {
            startCity: formData.startCity,
            destinationCity: formData.destinationCity,
            stops: stopsList,
            passengerCount: parseInt(formData.passengerCount),
            desiredActivities: desiredActivities,
            numberOfDays: numberOfDays,
            budget: formData.budget ? parseFloat(formData.budget) : 0,
            startDate: formData.startDate.toISOString()
        };

        try {
            const response = await request<{ tripId?: string; id?: string }>('/tripgeneration/generate', 'POST', requestBody, true);

            setSuccess('Trip generated successfully! Redirecting...');
            // Get trip ID from response (check both tripId and id fields)
            const tripId = response?.tripId || response?.id;
            
            // Redirect to specific trip page after 1.5 seconds
            setTimeout(() => {
                if (tripId) {
                    navigate(`/trips/${tripId}`);
                } else {
                    // Fallback to trips list if no ID in response
                    navigate('/trips');
                }
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to generate trip. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className='flex flex-col gap-4 bg-white p-5 md:p-8 rounded-lg shadow-xl border border-gray-200 text-gray-800 min-h-24 w-full max-w-5xl mx-6'>
            <div className='text-center font-serif text-shadow-lg text-3xl lg:text-4xl mb-4 text-primary'>
                Trip Generator
            </div>
            
            <form onSubmit={handleSubmit} className='flex flex-col w-full'>
                {error && (
                    <div className='flex items-center mb-4 bg-red-50 rounded-md p-3 border border-red-200'>
                        <MdError className='mr-2 h-6 w-6 text-red-600' />
                        <span className='text-red-600'>{error}</span>
                    </div>
                )}

                {success && (
                    <div className='flex items-center mb-4 bg-green-50 rounded-md p-3 border border-green-200'>
                        <MdCheckCircle className='mr-2 h-6 w-6 text-green-600' />
                        <span className='text-green-600'>{success}</span>
                    </div>
                )}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Input
                        label='Start City *'
                        type='text'
                        name='startCity'
                        value={formData.startCity}
                        placeholder='e.g., Bucharest, Romania'
                        icon={<FaMapMarkerAlt />}
                        onChange={handleInputChange}
                    />

                    <Input
                        label='Destination City *'
                        type='text'
                        name='destinationCity'
                        value={formData.destinationCity}
                        placeholder='e.g., Paris, France'
                        icon={<FaMapMarkerAlt />}
                        onChange={handleInputChange}
                    />

                    <Select
                        label='Trip Type *'
                        name='tripType'
                        value={formData.tripType}
                        onChange={handleInputChange}
                        options={tripTypes}
                        placeholder='Select trip type'
                    />

                    <DateInput
                        label='Start Date *'
                        name='startDate'
                        selected={formData.startDate}
                        onChange={(date) => handleDateChange('startDate', date)}
                        minDate={new Date()}
                        placeholder='Select start date'
                    />

                    <DateInput
                        label='End Date *'
                        name='endDate'
                        selected={formData.endDate}
                        onChange={(date) => handleDateChange('endDate', date)}
                        minDate={formData.startDate || new Date()}
                        placeholder='Select end date'
                    />

                    <Input
                        label='Number of Passengers *'
                        type='number'
                        name='passengerCount'
                        value={formData.passengerCount}
                        placeholder='e.g., 2'
                        icon={<FaUsers />}
                        onChange={handleInputChange}
                    />

                    <Input
                        label='Budget (Optional)'
                        type='number'
                        name='budget'
                        value={formData.budget}
                        placeholder='e.g., 5000'
                        icon={<FaDollarSign />}
                        onChange={handleInputChange}
                    />
                </div>

                <div>
                    <Input
                        label='Stops (Optional)'
                        type='text'
                        name='stops'
                        value={formData.stops}
                        placeholder='Comma-separated cities, e.g., Vienna, Munich'
                        icon={<FaMapMarkerAlt />}
                        onChange={handleInputChange}
                    />
                </div>

                <div>
                    <label htmlFor='preferences' className='block mb-2 text-sm font-medium text-gray-900'>
                        Desired Activities / Preferences (Optional)
                    </label>
                    <div className='flex mb-4 p-1 rounded-md shadow-md bg-white w-full focus-within:ring-2 focus-within:ring-secondary'>
                        <textarea
                            name='preferences'
                            value={formData.preferences}
                            onChange={handleInputChange}
                            placeholder='Any specific requirements or preferences...'
                            rows={4}
                            className='p-2 border-0 w-full rounded-md focus:ring-0 focus:outline-none text-gray-900 resize-none'
                        />
                    </div>
                </div>

                <button
                    type='submit'
                    disabled={loading}
                    className='bg-secondary hover:bg-accent text-white cursor-pointer font-bold py-3 px-6 rounded-lg flex justify-center items-center transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    {loading ? 'Generating Trip...' : 'Generate Trip Itinerary'}
                </button>
            </form>
        </div>
    );
};

export default TripGenerator;
