import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from '../../utils/axiosConfig';
import { computeVoteCommitment, generateNonce, saveVoteSecret } from '../../utils/voteCommitment';
import { getTokenPayload } from '../../utils/jwt';
import {
    API_BASE_URL,
    API_PATHS,
    DEFAULT_DEMO_STUDENT_CODE,
    STORAGE_KEYS,
} from '../../utils/constants';
import CountdownTimer from '../CountdownTimer';

type Election = {
    id: number;
    title: string;
    stateLabel: string;
    votingOpen: boolean;
    candidateCount: number;
    endTime: number;
    candidates?: Array<{ id: number; name: string }>;
};

type VoterSession = {
    token: string;
    voterHash: string;
    electionId: number;
};

const VotingDetail = () => {
    const params = useParams();
    const electionId = Number(params.id);
    const [election, setElection] = useState<Election | null>(null);
    const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadElection = async () => {
            if (!Number.isFinite(electionId)) {
                setError('Invalid election ID.');
                setLoading(false);
                return;
            }
            setLoading(true);
            setError('');
            try {
                const res = await apiClient.get<Election>(`/elections/${electionId}`);
                setElection(res.data);
            } catch (err: any) {
                setError(err?.response?.data?.error || 'Failed to load election details.');
            } finally {
                setLoading(false);
            }
        };
        loadElection();
    }, [electionId]);

    const optionItems = useMemo(() => {
        if (!election) return [];
        if (election.candidates && election.candidates.length > 0) {
            return election.candidates;
        }
        return Array.from({ length: election.candidateCount }, (_, idx) => ({
            id: idx + 1,
            name: `Option ${idx + 1}`,
        }));
    }, [election]);

    const getVoterSession = (id: number): VoterSession | null => {
        const raw = localStorage.getItem(`${STORAGE_KEYS.voterSessionPrefix}${id}`);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as VoterSession;
        } catch {
            return null;
        }
    };

    const saveVoterSession = (session: VoterSession) => {
        localStorage.setItem(`${STORAGE_KEYS.voterSessionPrefix}${session.electionId}`, JSON.stringify(session));
    };

    const getBoundStudentCode = (): string | null => {
        const payload = getTokenPayload() || {};
        const accountKey = String(payload.email || payload.sub || payload.userId || payload.id || '').trim();
        if (!accountKey) return null;
        const studentCode = localStorage.getItem(`${STORAGE_KEYS.studentIdPrefix}${accountKey}`);
        return studentCode ? studentCode.trim().toUpperCase() : null;
    };

    const ensureVoterSession = async (id: number): Promise<VoterSession> => {
        const existing = getVoterSession(id);
        if (existing?.token && existing?.voterHash) {
            return existing;
        }

        const studentCode = getBoundStudentCode() || DEFAULT_DEMO_STUDENT_CODE;

        const response = await apiClient.post(API_PATHS.badge, {
            studentCode,
            electionId: id,
            faceVerified: true,
            faceVerifiedAt: Date.now(),
        });

        const session: VoterSession = {
            token: response.data?.token,
            voterHash: response.data?.voterHash,
            electionId: Number(response.data?.electionId ?? id),
        };
        if (!session.token || !session.voterHash) {
            throw new Error('Could not get voter authorization token.');
        }
        saveVoterSession(session);
        return session;
    };

    const submitVote = async () => {
        if (!election) return;
        if (!selectedOptionId) {
            setError('Please choose an option first.');
            return;
        }

        setError('');
        setMessage('');
        setSubmitting(true);
        try {
            const session = await ensureVoterSession(election.id);
            const nonce = generateNonce();
            const commitment = computeVoteCommitment(session.voterHash, selectedOptionId, nonce, election.id);
            const response = await fetch(`${API_BASE_URL}${API_PATHS.votes}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.token}`,
                },
                body: JSON.stringify({
                    electionId: election.id,
                    commitment,
                }),
            });
            const body = await response.json();
            if (!response.ok) {
                throw new Error(body?.error || 'Vote submission failed.');
            }

            saveVoteSecret({
                electionId: election.id,
                candidateId: selectedOptionId,
                nonce,
                commitment,
            });
            setMessage('Vote submitted successfully.');
        } catch (err: any) {
            setError(err.message || 'Vote submission failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className='w-full max-w-3xl mx-auto bg-white p-7 rounded-lg shadow-xl border border-gray-200 text-gray-800'>
            <h1 className='text-3xl font-bold mb-4 text-center text-primary'>Voting Details</h1>
            {loading && <p className='text-gray-600'>Loading election...</p>}
            {error && <div className='mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700'>{error}</div>}
            {message && <div className='mb-4 p-3 rounded border border-green-200 bg-green-50 text-green-700'>{message}</div>}

            {!loading && election && (
                <>
                    <h2 className='text-xl font-semibold'>{election.title}</h2>
                    <div className='flex items-center gap-4 mt-1'>
                        <p className='text-sm text-gray-600'>Election #{election.id} · {election.stateLabel}</p>
                        {election.votingOpen && election.endTime > 0 && (
                            <CountdownTimer endTime={election.endTime} />
                        )}
                    </div>

                    <div className='mt-4'>
                        <p className='text-sm font-semibold mb-2'>Choose your option:</p>
                        {optionItems.length === 0 ? (
                            <div className='p-3 rounded border border-gray-200 bg-gray-50 text-sm text-gray-700'>
                                This voting has no configured options yet.
                            </div>
                        ) : (
                            <div className='flex flex-wrap gap-2'>
                                {optionItems.map((option) => {
                                    const isSelected = selectedOptionId === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            type='button'
                                            onClick={() => setSelectedOptionId(option.id)}
                                            className={`px-4 py-2 rounded border font-semibold transition-colors ${
                                                isSelected
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                                            }`}
                                        >
                                            {option.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className='mt-5 flex flex-wrap gap-2'>
                        <button
                            type='button'
                            onClick={submitVote}
                            disabled={submitting || optionItems.length === 0}
                            className='bg-black hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded disabled:opacity-50'
                        >
                            {submitting ? 'Submitting...' : 'Submit Vote'}
                        </button>
                        <Link
                            to={`/face-check?electionId=${election.id}`}
                            className='border border-gray-300 hover:bg-gray-100 font-semibold px-4 py-2 rounded'
                        >
                            Authenticate (Face Check)
                        </Link>
                        <Link
                            to='/votings'
                            className='border border-gray-300 hover:bg-gray-100 font-semibold px-4 py-2 rounded'
                        >
                            Back to Votings
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
};

export default VotingDetail;
