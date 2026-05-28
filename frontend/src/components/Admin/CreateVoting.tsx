import { useEffect, useState } from 'react';
import useRequestWithAuth from '../../hooks/useRequestWithAuth';
import { apiClient } from '../../utils/axiosConfig';
import { API_PATHS } from '../../utils/constants';

const CreateVoting = () => {
    const { request } = useRequestWithAuth();
    const [title, setTitle] = useState('');
    const [faculty, setFaculty] = useState('ALL');
    const [facultyOptions, setFacultyOptions] = useState<string[]>(['ALL']);
    const [loadingFaculties, setLoadingFaculties] = useState(true);
    const [durationHours, setDurationHours] = useState('1');
    const [options, setOptions] = useState<string[]>([]);
    const [electionId, setElectionId] = useState<number | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchFaculties = async () => {
            try {
                const res = await apiClient.get<{ faculties: string[] }>(API_PATHS.faculties);
                setFacultyOptions(['ALL', ...(res.data.faculties || [])]);
            } catch {
                setError('Failed to load faculty options.');
            } finally {
                setLoadingFaculties(false);
            }
        };
        fetchFaculties();
    }, []);

    const handleCreateAndOpen = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setElectionId(null);

        const cleanTitle = title.trim();
        const hours = Number(durationHours);
        const cleanedOptions = options.map((c) => c.trim()).filter(Boolean);

        if (!cleanTitle) {
            setError('Election title is required.');
            return;
        }
        if (!Number.isFinite(hours) || hours <= 0) {
            setError('Duration must be a positive number of hours.');
            return;
        }
        if (cleanedOptions.length < 2) {
            setError('Please provide at least 2 voting options.');
            return;
        }
        setLoading(true);
        try {
            const nowSec = Math.floor(Date.now() / 1000);
            const endSec = nowSec + Math.floor(hours * 3600);

            const created = await request<{ electionId: number }>(
                API_PATHS.adminElections,
                'POST',
                {
                    title: cleanTitle,
                    faculty,
                    startTime: nowSec,
                    endTime: endSec,
                    candidates: cleanedOptions,
                }
            );

            await request(`${API_PATHS.adminElections}/${created.electionId}/open`, 'POST');

            setElectionId(created.electionId);
            setMessage(`Election #${created.electionId} created and opened successfully.`);
        } catch (err: any) {
            setError(err.message || 'Failed to create/open election.');
        } finally {
            setLoading(false);
        }
    };

    const updateOption = (index: number, value: string) => {
        setOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
    };

    const addOption = () => {
        setOptions((prev) => [...prev, '']);
    };

    const removeOption = (index: number) => {
        setOptions((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className='w-full max-w-2xl mx-auto bg-white p-7 rounded-lg shadow-xl border border-gray-200 text-gray-800'>
            <h1 className='text-3xl font-bold mb-6 text-center text-primary'>Create Voting</h1>

            {error && <div className='mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700'>{error}</div>}
            {message && (
                <div className='mb-4 p-3 rounded border border-green-200 bg-green-50 text-green-700'>
                    {message}
                    {electionId != null && <div className='mt-1 font-semibold'>Election ID: {electionId}</div>}
                </div>
            )}

            <form onSubmit={handleCreateAndOpen} className='space-y-4'>
                <div>
                    <label className='block text-sm font-semibold mb-1'>Election Title</label>
                    <input
                        type='text'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder='e.g. UPB Senate Election 2026'
                        className='w-full border rounded px-3 py-2'
                        required
                    />
                </div>

                <div>
                    <label className='block text-sm font-semibold mb-1'>Voting Duration (hours)</label>
                    <input
                        type='number'
                        min='1'
                        step='1'
                        value={durationHours}
                        onChange={(e) => setDurationHours(e.target.value)}
                        className='w-full border rounded px-3 py-2'
                        required
                    />
                </div>

                <div>
                    <label className='block text-sm font-semibold mb-1'>Faculty Scope</label>
                    <select
                        value={faculty}
                        onChange={(e) => setFaculty(e.target.value)}
                        className='w-full border rounded px-3 py-2 bg-white'
                        disabled={loadingFaculties}
                    >
                        {facultyOptions.map((option) => (
                            <option key={option} value={option}>
                                {option === 'ALL' ? 'All faculties' : option}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className='block text-sm font-semibold mb-2'>Voting Options *</label>
                    <p className='text-sm text-gray-600 mb-2'>
                        Add at least 2 options users can choose from when voting.
                    </p>
                    <div className='space-y-2'>
                        {options.length === 0 && (
                            <div className='text-sm text-gray-500 italic'>No options added yet.</div>
                        )}
                        {options.map((option, index) => (
                            <div key={index} className='flex gap-2'>
                                <input
                                    type='text'
                                    value={option}
                                    onChange={(e) => updateOption(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    className='flex-1 border rounded px-3 py-2'
                                />
                                <button
                                    type='button'
                                    onClick={() => removeOption(index)}
                                    className='px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type='button'
                        onClick={addOption}
                        className='mt-2 px-4 py-2 rounded border border-gray-300 text-gray-800 hover:bg-gray-100'
                    >
                        Add Option
                    </button>
                </div>

                <button
                    type='submit'
                    disabled={loading}
                    className='w-full bg-black hover:bg-gray-700 text-white font-bold py-2 px-2 rounded transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
                >
                    {loading ? 'Creating election...' : 'Create and Open Voting'}
                </button>
            </form>
        </div>
    );
};

export default CreateVoting;
