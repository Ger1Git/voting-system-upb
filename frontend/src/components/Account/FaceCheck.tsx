import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { getTokenPayload } from '../../utils/jwt';
import { FACE_MATCH_THRESHOLD, FACE_MODEL_URL, STORAGE_KEYS } from '../../utils/constants';

const FaceCheck = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [studentCode, setStudentCode] = useState('');
    const [modelsReady, setModelsReady] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [status, setStatus] = useState('Loading face models...');
    const [verified, setVerified] = useState(false);
    const [accountKey, setAccountKey] = useState('');
    const [boundStudentCode, setBoundStudentCode] = useState('');

    const normalizedCode = useMemo(() => studentCode.trim().toUpperCase(), [studentCode]);
    const hasBoundId = Boolean(boundStudentCode) && normalizedCode === boundStudentCode;
    const isEnrolled = hasBoundId && Boolean(
        accountKey && localStorage.getItem(`${STORAGE_KEYS.faceEnrollPrefix}${accountKey}_${normalizedCode}`)
    );

    useEffect(() => {
        let mounted = true;
        const payload = getTokenPayload() || {};
        const key = String(payload.email || payload.sub || payload.userId || payload.id || '').trim();

        if (key) {
            setAccountKey(key);
            const saved = localStorage.getItem(`${STORAGE_KEYS.studentIdPrefix}${key}`);
            if (saved) {
                setStudentCode(saved);
                setBoundStudentCode(saved);
            }
        } else {
            setStatus('Could not detect account. Please log in again.');
        }

        const loadModelsAndCamera = async () => {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODEL_URL),
                ]);
                if (!mounted) return;
                setModelsReady(true);

                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return; }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
                setCameraReady(true);
                setStatus('Ready.');
            } catch {
                setStatus('Could not load camera. Check permissions and internet.');
            }
        };

        loadModelsAndCamera();
        return () => {
            mounted = false;
            streamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    const getFaceKey = () => `${STORAGE_KEYS.faceEnrollPrefix}${accountKey}_${normalizedCode}`;

    const detectDescriptor = async () => {
        if (!videoRef.current) return null;
        const result = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();
        return result?.descriptor ?? null;
    };

    const handleLinkId = () => {
        if (!accountKey) { setStatus('No account detected. Please log in again.'); return; }
        if (!normalizedCode) { setStatus('Enter a valid student ID first.'); return; }
        localStorage.setItem(`${STORAGE_KEYS.studentIdPrefix}${accountKey}`, normalizedCode);
        setBoundStudentCode(normalizedCode);
        setVerified(false);
        setStatus(`Student ID ${normalizedCode} linked.`);
    };

    /** First call → enroll. Subsequent calls → verify against enrollment. */
    const handleVerify = async () => {
        if (!hasBoundId) { setStatus('Link your student ID first.'); return; }

        setVerified(false);
        const descriptor = await detectDescriptor();
        if (!descriptor) {
            setStatus('No face detected. Centre your face and try again.');
            return;
        }

        const saved = localStorage.getItem(getFaceKey());
        if (!saved) {
            // First time — save as enrollment reference
            localStorage.setItem(getFaceKey(), JSON.stringify(Array.from(descriptor)));
            setStatus(`Face enrolled for ${normalizedCode}. Press Verify Face again to confirm identity.`);
            return;
        }

        const reference = new Float32Array(JSON.parse(saved));
        const dist = faceapi.euclideanDistance(reference, new Float32Array(Array.from(descriptor)));

        if (dist <= FACE_MATCH_THRESHOLD) {
            setVerified(true);
            setStatus(`Identity confirmed for ${normalizedCode}.`);
        } else {
            setVerified(false);
            setStatus(`Face not recognised for ${normalizedCode}. Try again.`);
        }
    };

    const ready = modelsReady && cameraReady;

    return (
        <div className='w-full max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md border border-gray-200'>
            <h1 className='text-2xl font-bold text-primary mb-1'>Face Verification</h1>
            <p className='text-sm text-gray-500 mb-5'>Confirm your identity before voting.</p>

            {/* Student ID */}
            <div className='mb-4'>
                <label className='block text-sm font-semibold mb-1'>Student ID</label>
                <div className='flex gap-2'>
                    <input
                        type='text'
                        value={studentCode}
                        onChange={(e) => setStudentCode(e.target.value)}
                        placeholder='e.g. J24280'
                        className='flex-1 border rounded px-3 py-2 text-sm'
                    />
                    <button
                        type='button'
                        onClick={handleLinkId}
                        className='bg-gray-800 hover:bg-black text-white text-sm font-semibold px-4 py-2 rounded'
                    >
                        Link ID
                    </button>
                </div>
                {hasBoundId && (
                    <p className='text-xs text-green-600 mt-1'>
                        {isEnrolled ? '✓ Enrolled' : '⚠ Not enrolled yet — press Verify Face to enroll'}
                    </p>
                )}
            </div>

            {/* Camera */}
            <video ref={videoRef} className='w-full h-[300px] bg-black rounded-md mb-4 object-cover' muted playsInline autoPlay />

            {/* Status */}
            <div className={`mb-4 p-3 rounded text-sm font-medium ${
                verified
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-gray-50 border border-gray-200 text-gray-700'
            }`}>
                {status}
            </div>

            {/* Actions */}
            <div className='flex flex-wrap gap-2'>
                <button
                    type='button'
                    onClick={handleVerify}
                    disabled={!ready || !hasBoundId}
                    className='bg-primary hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded disabled:opacity-50'
                >
                    {isEnrolled ? 'Verify Face' : 'Enroll & Verify'}
                </button>
                <Link to='/votings' className='px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 text-sm font-semibold'>
                    Back to Votings
                </Link>
            </div>
        </div>
    );
};

export default FaceCheck;
