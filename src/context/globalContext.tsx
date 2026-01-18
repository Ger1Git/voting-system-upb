import React, { useContext, useState, ReactNode } from 'react';
import useRequestWithAuth from '../hooks/useRequestWithAuth';

export type Trip = {
    id: string;
    destination: string;
    startDate: Date | string | null;
    endDate: Date | string | null;
    numberOfPeople: number;
    budget?: number | null;
    tripType: string;
    preferences?: string | null;
    createdAt: Date | string | null;
    status?: string;
    adminFeedback?: string | null;
}

export type Bus = {
    id: string;
    name: string;
    capacity: number;
    plateNumber: string;
    createdAt: Date;
}

type TravelContextType = {
    addTrip: (trip: Partial<Trip>) => Promise<void>;
    getTrips: () => Promise<void>;
    deleteTrip: (id: string) => Promise<void>;
    updateTrip: (id: string, data: Partial<Trip>) => Promise<any>;
    generateTrip: (tripData: Partial<Trip>) => Promise<any>;
    getBuses: () => Promise<void>;
    trips: Trip[];
    buses: Bus[];
    successTrips: string;
    tripsError: string;
    setSuccessTrips: (message: string) => void;
    setTripsError: (error: string) => void;
    busesError: string;
}

const TravelContext = React.createContext<TravelContextType | undefined>(undefined);

interface ProviderProps {
    children: ReactNode;
}

export const Provider = ({ children }: ProviderProps) => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [buses, setBuses] = useState<Bus[]>([]);
    const [successTrips, setSuccessTrips] = useState('');
    const [tripsError, setTripsError] = useState('');
    const [busesError, setBusesError] = useState('');
    const { request } = useRequestWithAuth();

    const addTrip = async (trip: Partial<Trip>) => {
        try {
            await request('/add-trip', 'POST', trip);
            setSuccessTrips('Trip successfully added');
            setTripsError('');
            getTrips();
        } catch (err: any) {
            setTripsError(err.message);
        }
    };

    const getTrips = async () => {
        try {
            const data = await request<Trip[]>('/trips');
            setTripsError('');
            setTrips(data);
        } catch (error: any) {
            setTripsError(error.message);
        }
    };

    const deleteTrip = async (id: string) => {
        try {
            await request(`/delete-trip/${id}`, 'DELETE');
            setTripsError('');
            setSuccessTrips('Trip successfully deleted');
            getTrips();
        } catch (error: any) {
            setTripsError(error.message);
        }
    };

    const updateTrip = async (id: string, data: Partial<Trip>) => {
        try {
            const response = await request(`/update-trip/${id}`, 'PUT', data);
            return response;
        } catch (error: any) {
            setTripsError(error.response.data.message);
        }
    };

    const generateTrip = async (tripData: Partial<Trip>) => {
        try {
            const response = await request('/generate-trip', 'POST', tripData);
            setSuccessTrips('Trip generated successfully');
            setTripsError('');
            return response;
        } catch (error: any) {
            setTripsError(error.message);
            throw error;
        }
    };

    const getBuses = async () => {
        try {
            const data = await request<Bus[]>('/get-buses');
            setBusesError('');
            setBuses(data);
        } catch (error: any) {
            setBusesError(error.message);
        }
    };

    return (
        <TravelContext.Provider
            value={{
                addTrip,
                getTrips,
                deleteTrip,
                updateTrip,
                generateTrip,
                getBuses,
                trips,
                buses,
                successTrips,
                tripsError,
                setSuccessTrips,
                setTripsError,
                busesError,
            }}
        >
            {children}
        </TravelContext.Provider>
    );
};

export const useTravelContext = () => {
    const context = useContext(TravelContext);
    if (!context) {
        throw new Error('useTravelContext must be used within a TravelProvider');
    }
    return context;
};
