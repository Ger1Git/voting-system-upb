import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useRequestWithAuth from '../../hooks/useRequestWithAuth';
import { apiClient } from '../../utils/axiosConfig';
import { FaArrowLeft, FaMapMarkerAlt, FaUsers, FaDollarSign, FaCalendarAlt, FaRoute, FaBus, FaGasPump, FaReceipt, FaChartLine, FaFilePdf } from 'react-icons/fa';
import RouteMap from '../Map';

interface RouteSegment {
    fromLocation: string;
    toLocation: string;
    distanceKm: number;
    durationMinutes: number;
    departureTime?: string | null;
}

interface Activity {
    name: string;
    description: string;
    scheduledTime: string;
    durationMinutes: number;
    cost: number;
    locationName: string;
}

interface DayPlan {
    dayNumber: number;
    dayCost: number;
    accommodationName: string;
    activities: Activity[];
    routeSegments: RouteSegment[];
}

interface Vehicle {
    vehicleId: number;
    model: string;
    seatCapacity: number;
    fuelConsumptionPerKm: number;
    isAvailable: boolean;
}

interface TripCosts {
    totalCost: number;
    fuelCost: number;
    vatAmount: number;
    totalCostWithVat: number;
    profit: number;
}

interface TripDetails {
    id: string;
    startCity: string;
    destinationCity: string;
    stops: string[];
    passengerCount: number;
    desiredActivities: string[];
    numberOfDays: number;
    budget: number;
    startDate: string;
    itinerary: {
        totalDistance: number;
        totalDurationMinutes: number;
    };
    dayPlans: DayPlan[];
    vehicle?: Vehicle | null;
    costs?: TripCosts;
}

const TripDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { request } = useRequestWithAuth();
    const [trip, setTrip] = useState<TripDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [generatingPdf, setGeneratingPdf] = useState(false);

    useEffect(() => {
        const fetchTripDetails = async () => {
            try {
                setLoading(true);
                const data = await request<TripDetails>(`/trips/${id}`, 'GET');
                setTrip(data);
                setError('');
            } catch (err: any) {
                setError(err.response?.data?.error || err.message || 'Failed to load trip details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchTripDetails();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const formatTime = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    // Build waypoints for map
    const getMapWaypoints = () => {
        if (!trip) return [];
        const waypoints: string[] = [trip.startCity];
        waypoints.push(...trip.stops);
        waypoints.push(trip.destinationCity);
        return waypoints;
    };

    // Build Google Maps Directions URL (opens in new tab, no API key needed)
    const getGoogleMapsDirectionsUrl = () => {
        const waypoints = getMapWaypoints();
        if (waypoints.length < 2) return '';
        
        const query = waypoints.join('/');
        return `https://www.google.com/maps/dir/${query.split(' ').join('+')}`;
    };

    // Generate PDF
    const handleGeneratePdf = async () => {
        if (!trip) return;

        try {
            setGeneratingPdf(true);
            setError('');

            // Transform trip data to match backend Trip model structure
            const tripData = {
                parameters: {
                    startCity: trip.startCity,
                    destinationCity: trip.destinationCity,
                    stops: trip.stops,
                    passengerCount: trip.passengerCount,
                    desiredActivities: trip.desiredActivities,
                    numberOfDays: trip.numberOfDays,
                    budget: trip.budget,
                    startDate: trip.startDate
                },
                itinerary: {
                    totalDistance: trip.itinerary.totalDistance,
                    totalDurationMinutes: trip.itinerary.totalDurationMinutes,
                    days: trip.dayPlans.map(day => ({
                        dayNumber: day.dayNumber,
                        dayCost: day.dayCost,
                        accomodationName: day.accommodationName,
                        activities: day.activities.map(activity => ({
                            name: activity.name,
                            description: activity.description,
                            scheduledTime: activity.scheduledTime,
                            durationMinutes: activity.durationMinutes,
                            cost: activity.cost,
                            locationName: activity.locationName
                        })),
                        segments: day.routeSegments.map(segment => ({
                            fromLocation: segment.fromLocation,
                            toLocation: segment.toLocation,
                            distanceKm: segment.distanceKm,
                            durationMinutes: segment.durationMinutes,
                            departureTime: segment.departureTime
                        }))
                    }))
                },
                totalCost: trip.costs?.totalCost || 0,
                fuelCost: trip.costs?.fuelCost || 0,
                vatAmount: trip.costs?.vatAmount || 0,
                totalCostWithVat: trip.costs?.totalCostWithVat || 0,
                profit: trip.costs?.profit || 0,
                vehicle: trip.vehicle || null
            };

            // Call PDF generation endpoint using apiClient
            const response = await apiClient.post('/pdfgenerator/generate', tripData, {
                responseType: 'blob'
            });

            // Get PDF blob and trigger download
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Itinerary_${trip.startCity}_${trip.destinationCity}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(err.message || 'Failed to generate PDF. Please try again.');
        } finally {
            setGeneratingPdf(false);
        }
    };

    if (loading) {
        return (
            <div className='flex flex-col gap-4 bg-white p-5 rounded-lg shadow-xl border border-gray-200 text-gray-800 min-h-24 w-full max-w-7xl mx-auto'>
                <div className='text-center py-8'>
                    <p className='text-gray-600'>Loading trip details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='flex flex-col gap-4 bg-white p-5 rounded-lg shadow-xl border border-gray-200 text-gray-800 min-h-24 w-full max-w-7xl mx-auto'>
                <div className='text-center py-8'>
                    <p className='text-red-600'>{error}</p>
                    <Link to='/trips' className='text-primary hover:text-secondary mt-4 inline-block'>
                        ← Back to Trips
                    </Link>
                </div>
            </div>
        );
    }

    if (!trip) {
        return null;
    }

    const waypoints = getMapWaypoints();

    return (
        <div className='flex flex-col gap-6 bg-white p-5 md:p-8 rounded-lg shadow-xl border border-gray-200 text-gray-800 min-h-24 w-full max-w-7xl mx-auto'>
            <div className='flex items-center justify-between mb-4'>
                <Link 
                    to='/trips' 
                    className='flex items-center gap-2 text-primary hover:text-secondary transition-colors'
                >
                    <FaArrowLeft />
                    <span>Back to Trips</span>
                </Link>
                <button
                    onClick={handleGeneratePdf}
                    disabled={generatingPdf}
                    className='bg-red-600 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2'
                >
                    <FaFilePdf />
                    {generatingPdf ? 'Generating...' : 'Generate PDF'}
                </button>
            </div>

            <div className='text-center font-serif text-shadow-lg text-3xl lg:text-4xl mb-6 text-primary'>
                Trip Details
            </div>

            {/* Trip Overview */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
                <div className='bg-gray-50 p-4 rounded-lg'>
                    <div className='flex items-center gap-2 text-gray-600 mb-2'>
                        <FaMapMarkerAlt />
                        <span className='text-sm font-medium'>Route</span>
                    </div>
                    <p className='text-lg font-semibold'>{trip.startCity} → {trip.destinationCity}</p>
                </div>
                <div className='bg-gray-50 p-4 rounded-lg'>
                    <div className='flex items-center gap-2 text-gray-600 mb-2'>
                        <FaUsers />
                        <span className='text-sm font-medium'>Passengers</span>
                    </div>
                    <p className='text-lg font-semibold'>{trip.passengerCount}</p>
                </div>
                <div className='bg-gray-50 p-4 rounded-lg'>
                    <div className='flex items-center gap-2 text-gray-600 mb-2'>
                        <FaCalendarAlt />
                        <span className='text-sm font-medium'>Duration</span>
                    </div>
                    <p className='text-lg font-semibold'>{trip.numberOfDays} days</p>
                </div>
                <div className='bg-gray-50 p-4 rounded-lg'>
                    <div className='flex items-center gap-2 text-gray-600 mb-2'>
                        <FaDollarSign />
                        <span className='text-sm font-medium'>Budget</span>
                    </div>
                    <p className='text-lg font-semibold'>{formatCurrency(trip.budget)}</p>
                </div>
            </div>

            {/* Map */}
            <div className='mb-6'>
                <div className='flex items-center justify-between mb-4'>
                    <h2 className='text-2xl font-semibold flex items-center gap-2'>
                        <FaRoute />
                        Route Map
                    </h2>
                    {waypoints.length >= 2 && (
                        <a
                            href={getGoogleMapsDirectionsUrl()}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow text-sm font-medium hover:bg-secondary'
                        >
                            Open in Google Maps
                        </a>
                    )}
                </div>
                <div className='w-full rounded-lg overflow-hidden border border-gray-300 bg-gray-100'>
                    {waypoints.length >= 2 ? (
                        <RouteMap 
                            routeSegments={trip.dayPlans.flatMap(day => 
                                day.routeSegments.map(seg => ({
                                    fromLocation: seg.fromLocation,
                                    toLocation: seg.toLocation,
                                    distanceKM: seg.distanceKm,
                                    durationMinutes: seg.durationMinutes
                                }))
                            )}
                        />
                    ) : (
                        <div className='w-full h-96 flex items-center justify-center'>
                            <p className='text-gray-500'>Map unavailable - insufficient route information</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Itinerary Summary */}
            <div className='mb-6'>
                <h2 className='text-2xl font-semibold mb-4'>Itinerary Summary</h2>
                <div className='bg-gray-50 p-4 rounded-lg'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div>
                            <span className='text-sm text-gray-600'>Total Distance</span>
                            <p className='text-lg font-semibold'>{trip.itinerary.totalDistance.toFixed(2)} km</p>
                        </div>
                        <div>
                            <span className='text-sm text-gray-600'>Total Duration</span>
                            <p className='text-lg font-semibold'>{formatDuration(trip.itinerary.totalDurationMinutes)}</p>
                        </div>
                        <div>
                            <span className='text-sm text-gray-600'>Start Date</span>
                            <p className='text-lg font-semibold'>{formatDate(trip.startDate)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assigned Vehicle */}
            {trip.vehicle && (
                <div className='mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6'>
                    <h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
                        <FaBus className='text-primary' />
                        Assigned Vehicle
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div>
                            <span className='text-sm text-gray-600'>Model</span>
                            <p className='text-lg font-semibold'>{trip.vehicle.model}</p>
                        </div>
                        <div>
                            <span className='text-sm text-gray-600 flex items-center gap-1'>
                                <FaUsers className='text-primary' />
                                Seat Capacity
                            </span>
                            <p className='text-lg font-semibold'>{trip.vehicle.seatCapacity} seats</p>
                        </div>
                        <div>
                            <span className='text-sm text-gray-600 flex items-center gap-1'>
                                <FaGasPump className='text-primary' />
                                Fuel Consumption
                            </span>
                            <p className='text-lg font-semibold'>{trip.vehicle.fuelConsumptionPerKm} L/km</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Cost Breakdown */}
            {trip.costs && (
                <div className='mb-6 bg-green-50 border border-green-200 rounded-lg p-6'>
                    <h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
                        <FaReceipt className='text-primary' />
                        Cost Breakdown
                    </h2>
                    <div className='space-y-3'>
                        <div className='flex justify-between items-center py-2 border-b border-green-200'>
                            <span className='text-gray-700'>Base Cost (Accommodation & Activities)</span>
                            <span className='font-semibold'>{formatCurrency(trip.costs.totalCost)}</span>
                        </div>
                        <div className='flex justify-between items-center py-2 border-b border-green-200'>
                            <span className='text-gray-700 flex items-center gap-2'>
                                <FaGasPump className='text-primary' />
                                Fuel Cost
                            </span>
                            <span className='font-semibold'>{formatCurrency(trip.costs.fuelCost)}</span>
                        </div>
                        <div className='flex justify-between items-center py-2 border-b border-green-200'>
                            <span className='text-gray-700'>Subtotal (Before VAT)</span>
                            <span className='font-semibold'>{formatCurrency(trip.costs.totalCost + trip.costs.fuelCost)}</span>
                        </div>
                        <div className='flex justify-between items-center py-2 border-b border-green-200'>
                            <span className='text-gray-700'>VAT (21%)</span>
                            <span className='font-semibold text-red-600'>{formatCurrency(trip.costs.vatAmount)}</span>
                        </div>
                        <div className='flex justify-between items-center py-3 border-t-2 border-green-300'>
                            <span className='text-lg font-semibold text-gray-900'>Total Cost (With VAT)</span>
                            <span className='text-lg font-bold text-primary'>{formatCurrency(trip.costs.totalCostWithVat)}</span>
                        </div>
                        <div className='flex justify-between items-center py-3 bg-white rounded-lg px-4 border-2 border-green-400'>
                            <span className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
                                <FaChartLine className='text-primary' />
                                Budget
                            </span>
                            <span className='text-lg font-bold'>{formatCurrency(trip.budget)}</span>
                        </div>
                        <div className={`flex justify-between items-center py-3 rounded-lg px-4 ${trip.costs.profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            <span className='text-lg font-semibold text-gray-900'>Profit / Loss</span>
                            <span className={`text-lg font-bold ${trip.costs.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {formatCurrency(trip.costs.profit)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Day Plans */}
            <div className='mb-6'>
                <h2 className='text-2xl font-semibold mb-4'>Day-by-Day Itinerary</h2>
                <div className='space-y-6'>
                    {trip.dayPlans.map((dayPlan) => (
                        <div key={dayPlan.dayNumber} className='border border-gray-200 rounded-lg p-6'>
                            <div className='flex items-center justify-between mb-4'>
                                <h3 className='text-xl font-semibold'>Day {dayPlan.dayNumber}</h3>
                                <span className='text-lg font-semibold text-primary'>{formatCurrency(dayPlan.dayCost)}</span>
                            </div>
                            
                            {dayPlan.accommodationName && (
                                <div className='mb-4'>
                                    <span className='text-sm text-gray-600'>Accommodation: </span>
                                    <span className='font-medium'>{dayPlan.accommodationName}</span>
                                </div>
                            )}

                            {dayPlan.routeSegments.length > 0 && (
                                <div className='mb-4'>
                                    <h4 className='font-semibold mb-2 flex items-center gap-2'>
                                        <FaRoute />
                                        Route Segments
                                    </h4>
                                    <div className='space-y-2'>
                                        {dayPlan.routeSegments.map((segment, idx) => {
                                            const departureTime = segment.departureTime 
                                                ? formatTime(new Date(segment.departureTime))
                                                : null;
                                            const arrivalTime = segment.departureTime 
                                                ? formatTime(new Date(new Date(segment.departureTime).getTime() + segment.durationMinutes * 60000))
                                                : null;
                                            
                                            return (
                                                <div key={idx} className='bg-gray-50 p-3 rounded'>
                                                    <p className='font-medium'>{segment.fromLocation} → {segment.toLocation}</p>
                                                    <div className='text-sm text-gray-600 mt-1 space-y-1'>
                                                        {departureTime && (
                                                            <p>Departure: {departureTime}</p>
                                                        )}
                                                        {arrivalTime && (
                                                            <p>Arrival: {arrivalTime}</p>
                                                        )}
                                                        <p>
                                                            {segment.distanceKm.toFixed(2)} km • {formatDuration(segment.durationMinutes)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {dayPlan.activities.length > 0 && (
                                <div>
                                    <h4 className='font-semibold mb-2'>Activities</h4>
                                    <div className='space-y-3'>
                                        {dayPlan.activities.map((activity, idx) => (
                                            <div key={idx} className='bg-gray-50 p-3 rounded'>
                                                <div className='flex items-start justify-between'>
                                                    <div>
                                                        <p className='font-medium'>{activity.name}</p>
                                                        {activity.description && (
                                                            <p className='text-sm text-gray-600 mt-1'>{activity.description}</p>
                                                        )}
                                                        <div className='flex items-center gap-4 mt-2 text-sm text-gray-600'>
                                                            <span>📍 {activity.locationName}</span>
                                                            <span>🕐 {formatTime(activity.scheduledTime)}</span>
                                                            <span>⏱️ {formatDuration(activity.durationMinutes)}</span>
                                                            {activity.cost > 0 && (
                                                                <span>💰 {formatCurrency(activity.cost)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TripDetails;
