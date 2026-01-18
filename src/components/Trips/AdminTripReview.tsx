import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useRequestWithAuth from '../../hooks/useRequestWithAuth';
import { isAdmin } from '../../utils/jwt';
import { FaCheck, FaTimes, FaEye, FaUser } from 'react-icons/fa';
import { MdError } from 'react-icons/md';

interface DraftTrip {
    id: string;
    destination: string;
    startCity: string;
    startDate: string;
    endDate: string;
    numberOfPeople: number;
    budget: number;
    tripType: string;
    preferences: string;
    createdAt: string;
    creatorName: string;
    creatorEmail: string;
    status: string;
}

const AdminTripReview = () => {
    const navigate = useNavigate();
    const { request } = useRequestWithAuth();
    const [draftTrips, setDraftTrips] = useState<DraftTrip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [reviewingTripId, setReviewingTripId] = useState<string | null>(null);
    const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isAdmin()) {
            navigate('/account');
            return;
        }
        fetchDraftTrips();
    }, [navigate]);

    const fetchDraftTrips = async () => {
        try {
            setLoading(true);
            const data = await request<DraftTrip[]>('/trips/drafts', 'GET');
            setDraftTrips(data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to load draft trips');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (tripId: string) => {
        try {
            setReviewingTripId(tripId);
            setError('');
            setSuccess('');
            
            const feedbackText = feedbackMap[tripId] || '';
            const requestBody = feedbackText ? { feedback: feedbackText } : null;
            await request(`/trips/${tripId}/approve`, 'POST', requestBody);
            
            setSuccess('Trip approved successfully!');
            setFeedbackMap(prev => {
                const newMap = { ...prev };
                delete newMap[tripId];
                return newMap;
            });
            setReviewingTripId(null);
            fetchDraftTrips();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to approve trip');
            setReviewingTripId(null);
        }
    };

    const handleDisapprove = async (tripId: string) => {
        try {
            setReviewingTripId(tripId);
            setError('');
            setSuccess('');
            
            const feedbackText = feedbackMap[tripId] || '';
            const requestBody = feedbackText ? { feedback: feedbackText } : null;
            await request(`/trips/${tripId}/disapprove`, 'POST', requestBody);
            
            setSuccess('Trip disapproved. It will be deleted after 30 days.');
            setFeedbackMap(prev => {
                const newMap = { ...prev };
                delete newMap[tripId];
                return newMap;
            });
            setReviewingTripId(null);
            fetchDraftTrips();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to disapprove trip');
            setReviewingTripId(null);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    if (!isAdmin()) {
        return null;
    }

    return (
        <div className='flex flex-col gap-4 bg-white p-5 md:p-8 rounded-lg shadow-xl border border-gray-200 text-gray-800 min-h-24 w-full max-w-7xl mx-auto'>
            <div className='text-center font-serif text-shadow-lg text-3xl lg:text-4xl mb-6 text-primary'>
                Review Draft Trips
            </div>

            {error && (
                <div className='flex items-center mb-4 bg-red-50 rounded-md p-3 border border-red-200'>
                    <MdError className='mr-2 h-6 w-6 text-red-600' />
                    <span className='text-red-600'>{error}</span>
                </div>
            )}

            {success && (
                <div className='flex items-center mb-4 bg-green-50 rounded-md p-3 border border-green-200'>
                    <FaCheck className='mr-2 h-6 w-6 text-green-600' />
                    <span className='text-green-600'>{success}</span>
                </div>
            )}

            {loading ? (
                <div className='text-center py-8'>
                    <p className='text-gray-600'>Loading draft trips...</p>
                </div>
            ) : draftTrips.length === 0 ? (
                <div className='text-center py-12'>
                    <p className='text-xl text-gray-600 mb-4'>No draft trips to review</p>
                    <p className='text-gray-500'>All trips have been reviewed.</p>
                </div>
            ) : (
                <div className='space-y-6'>
                    {draftTrips.map((trip) => (
                        <div key={trip.id} className='border border-gray-200 rounded-lg p-6 bg-gray-50'>
                            <div className='flex items-start justify-between mb-4'>
                                <div className='flex-1'>
                                    <h3 className='text-xl font-semibold mb-2'>
                                        {trip.startCity} → {trip.destination}
                                    </h3>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600'>
                                        <div className='flex items-center gap-2'>
                                            <FaUser />
                                            <span>Created by: {trip.creatorName} ({trip.creatorEmail})</span>
                                        </div>
                                        <div>Start: {formatDate(trip.startDate)}</div>
                                        <div>End: {formatDate(trip.endDate)}</div>
                                        <div>People: {trip.numberOfPeople}</div>
                                        <div>Budget: {formatCurrency(trip.budget || 0)}</div>
                                        <div>Type: {trip.tripType}</div>
                                        <div>Created: {formatDate(trip.createdAt)}</div>
                                    </div>
                                </div>
                                <Link
                                    to={`/trips/${trip.id}`}
                                    className='ml-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors flex items-center gap-2'
                                >
                                    <FaEye />
                                    View Details
                                </Link>
                            </div>

                            <div className='mt-4 pt-4 border-t border-gray-200'>
                                <label className='block mb-2 text-sm font-medium text-gray-900'>
                                    Feedback (Optional)
                                </label>
                                <textarea
                                    value={feedbackMap[trip.id] || ''}
                                    onChange={(e) => setFeedbackMap(prev => ({ ...prev, [trip.id]: e.target.value }))}
                                    placeholder='Add feedback for the trip creator...'
                                    rows={2}
                                    className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary mb-3'
                                />
                                <div className='flex gap-3'>
                                    <button
                                        onClick={() => handleApprove(trip.id)}
                                        disabled={reviewingTripId === trip.id}
                                        className='flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                    >
                                        <FaCheck />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleDisapprove(trip.id)}
                                        disabled={reviewingTripId === trip.id}
                                        className='flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                    >
                                        <FaTimes />
                                        Disapprove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminTripReview;
