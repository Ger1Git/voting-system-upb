import { useState, useEffect } from 'react';
import useRequestWithAuth from '../../hooks/useRequestWithAuth';
import { FaBus, FaUsers, FaGasPump, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface Vehicle {
    vehicleId: number;
    model: string;
    seatCapacity: number;
    fuelConsumptionPerKm: number;
    isAvailable: boolean;
}

const Buses = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        model: '',
        seatCapacity: '',
        fuelConsumptionPerKm: '',
        isAvailable: true
    });
    const [submitting, setSubmitting] = useState(false);
    const { request } = useRequestWithAuth();

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const data = await request<Vehicle[]>('/vehicles', 'GET');
            setVehicles(data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to load vehicles');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        if (!formData.model.trim()) {
            setError('Model is required');
            setSubmitting(false);
            return;
        }

        if (parseInt(formData.seatCapacity) <= 0) {
            setError('Seat capacity must be greater than 0');
            setSubmitting(false);
            return;
        }

        if (parseFloat(formData.fuelConsumptionPerKm) <= 0) {
            setError('Fuel consumption must be greater than 0');
            setSubmitting(false);
            return;
        }

        try {
            const response = await request<{ success: boolean; vehicleId: number; message: string }>(
                '/vehicles',
                'POST',
                {
                    model: formData.model,
                    seatCapacity: parseInt(formData.seatCapacity),
                    fuelConsumptionPerKm: parseFloat(formData.fuelConsumptionPerKm),
                    isAvailable: formData.isAvailable
                }
            );
            setSuccess('Bus added successfully!');
            setFormData({
                model: '',
                seatCapacity: '',
                fuelConsumptionPerKm: '',
                isAvailable: true
            });
            await fetchVehicles();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to add bus');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className='flex flex-col gap-4 bg-white p-5 rounded-lg shadow-xl border border-gray-200 text-gray-800 min-h-24 w-full max-w-7xl mx-auto'>
            <div className='text-center font-serif text-shadow-lg text-3xl lg:text-4xl mb-6 text-primary'>
                Manage Buses
            </div>

            <div className='flex flex-col lg:flex-row gap-8'>
                {/* Add Bus Form */}
                <div className='flex-1 bg-white p-6 rounded-lg shadow-lg border border-gray-200'>
                    <h2 className='text-xl font-semibold text-primary mb-4 flex items-center gap-2'>
                        <FaBus /> Add New Bus
                    </h2>
                    
                    {error && (
                        <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className='mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2'>
                            <FaCheckCircle /> {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Model
                            </label>
                            <input
                                type='text'
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                                placeholder='e.g., Mercedes Tourismo'
                                required
                            />
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Seat Capacity
                            </label>
                            <input
                                type='number'
                                value={formData.seatCapacity}
                                onChange={(e) => setFormData({ ...formData, seatCapacity: e.target.value })}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                                placeholder='e.g., 50'
                                min='1'
                                required
                            />
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Fuel Consumption (L/km)
                            </label>
                            <input
                                type='number'
                                step='0.01'
                                value={formData.fuelConsumptionPerKm}
                                onChange={(e) => setFormData({ ...formData, fuelConsumptionPerKm: e.target.value })}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                                placeholder='e.g., 0.08'
                                min='0.01'
                                required
                            />
                        </div>

                        <div className='flex items-center gap-2'>
                            <input
                                type='checkbox'
                                id='isAvailable'
                                checked={formData.isAvailable}
                                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                className='w-4 h-4 text-primary focus:ring-primary'
                            />
                            <label htmlFor='isAvailable' className='text-sm font-medium text-gray-700'>
                                Available
                            </label>
                        </div>

                        <button
                            type='submit'
                            disabled={submitting}
                            className='w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {submitting ? 'Adding...' : 'Add Bus'}
                        </button>
                    </form>
                </div>

                {/* Buses List */}
                <div className='flex-1 bg-white p-6 rounded-lg shadow-lg border border-gray-200 max-h-[600px] overflow-y-auto'>
                    <h2 className='text-xl font-semibold text-primary mb-4'>All Buses</h2>
                    
                    {loading ? (
                        <p className='text-center text-gray-600'>Loading buses...</p>
                    ) : vehicles.length > 0 ? (
                        <div className='space-y-4'>
                            {vehicles.map((vehicle) => (
                                <div
                                    key={vehicle.vehicleId}
                                    className='p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow'
                                >
                                    <div className='flex items-start justify-between mb-2'>
                                        <h3 className='text-lg font-semibold text-gray-900'>{vehicle.model}</h3>
                                        {vehicle.isAvailable ? (
                                            <span className='flex items-center gap-1 text-green-600 text-sm'>
                                                <FaCheckCircle /> Available
                                            </span>
                                        ) : (
                                            <span className='flex items-center gap-1 text-red-600 text-sm'>
                                                <FaTimesCircle /> Unavailable
                                            </span>
                                        )}
                                    </div>
                                    <div className='grid grid-cols-2 gap-2 text-sm text-gray-600'>
                                        <div className='flex items-center gap-2'>
                                            <FaUsers className='text-primary' />
                                            <span>{vehicle.seatCapacity} seats</span>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <FaGasPump className='text-primary' />
                                            <span>{vehicle.fuelConsumptionPerKm} L/km</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className='text-center text-xl text-gray-600'>No buses added yet</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Buses;
