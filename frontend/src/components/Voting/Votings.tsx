import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../utils/axiosConfig';
import { API_PATHS } from '../../utils/constants';
import CountdownTimer from '../CountdownTimer';

type Election = {
    id: number;
    title: string;
    state: number;
    stateLabel: string;
    votingOpen: boolean;
    candidateCount: number;
    startTime: number;
    endTime: number;
};

const Votings = () => {
    const navigate = useNavigate();
    const [elections, setElections] = useState<Election[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadElections = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await apiClient.get<{ elections: Election[] }>(API_PATHS.elections);
                setElections(res.data.elections || []);
            } catch (err: any) {
                setError(err?.response?.data?.error || 'Failed to load votings.');
            } finally {
                setLoading(false);
            }
        };
        loadElections();
    }, []);

    const openElections = useMemo(
        () => elections.filter((e) => e.votingOpen),
        [elections]
    );

    return (
        <div className='w-full max-w-4xl mx-auto bg-white p-7 rounded-lg shadow-xl border border-gray-200 text-gray-800'>
            <h1 className='text-3xl font-bold mb-6 text-center text-primary'>Open Votings</h1>

            {error && <div className='mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700'>{error}</div>}

            {loading ? (
                <p className='text-gray-600'>Loading votings...</p>
            ) : openElections.length === 0 ? (
                <p className='text-gray-600'>No voting is currently open.</p>
            ) : (
                <div className='space-y-4'>
                    {openElections.map((election) => {
                        return (
                            <div key={election.id} className='border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4'>
                                <div>
                                    <h2 className='text-xl font-semibold'>{election.title}</h2>
                                    {election.endTime > 0 && (
                                        <CountdownTimer endTime={election.endTime} className='mt-1 block' />
                                    )}
                                </div>
                                <button
                                    type='button'
                                    onClick={() => navigate(`/votings/${election.id}`)}
                                    className='shrink-0 bg-black hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded'
                                >
                                    Vote
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Votings;
