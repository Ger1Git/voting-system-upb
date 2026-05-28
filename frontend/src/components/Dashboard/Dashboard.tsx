import { useEffect, useState } from 'react';
import { useTravelContext, type Trip } from '../../context/globalContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { trips, getTrips } = useTravelContext();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            await getTrips();
            setLoading(false);
        };

        if (trips.length === 0) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, []);

    const renderTripItems = (tripList: Trip[]) => {
        return tripList.length > 0 ? (
            tripList.map((trip) => (
                <div key={trip.id} className='p-4 border border-gray-300 rounded-lg'>
                    <h3 className='font-bold text-lg'>{trip.destination}</h3>
                    <p>Start: {trip.startDate}</p>
                    <p>End: {trip.endDate}</p>
                    <p>People: {trip.numberOfPeople}</p>
                    <p>Type: {trip.tripType}</p>
                    <p>Budget: {trip.budget}</p>
                </div>
            ))
        ) : (
            <p className='text-center text-xl'>No trips yet</p>
        );
    };

    return (
        <div className='flex flex-col justify-center gap-10 lg:my-12'>
            <div className='flex flex-col gap-4 bg-white p-5 rounded-lg shadow-xl border border-gray-200 text-gray-800 min-h-24'>
                <div className='text-center text-3xl font-serif text-primary'>All Trips</div>
                {trips && trips.length > 0 ? (
                    <div className='flex flex-col gap-4 bg-white max-h-80 lg:max-h-96 p-5 rounded-lg shadow-xl border border-gray-200 text-gray-800 overflow-hidden overflow-y-auto custom-scrollbar'>
                        {!loading && renderTripItems(trips)}
                    </div>
                ) : (
                    <>
                        <p className='text-center text-xl'>No trips yet</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
