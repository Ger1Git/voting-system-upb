import { useEffect, useState } from 'react';
import { useTravelContext, type Trip } from '../../context/globalContext';
import { Link } from 'react-router-dom';
import TripItem from '../TripItem';

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
                <TripItem
                    key={trip.id}
                    _id={trip.id}
                    destination={trip.destination}
                    startDate={trip.startDate}
                    endDate={trip.endDate}
                    numberOfPeople={trip.numberOfPeople}
                    tripType={trip.tripType}
                    budget={trip.budget}
                />
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
                        <p className='text-center text-xl'>
                            To create a trip go to the
                            <Link className='text-secondary hover:text-accent cursor-pointer mx-2 underline' to='/trips'>
                                Trips
                            </Link>
                            tab
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
