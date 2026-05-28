import { useEffect, useState } from 'react';

type Props = {
    endTime: number; // unix timestamp in seconds
    className?: string;
};

function formatDuration(seconds: number): string {
    if (seconds <= 0) return 'Closed';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

const CountdownTimer = ({ endTime, className = '' }: Props) => {
    const [remaining, setRemaining] = useState(() =>
        Math.max(0, endTime - Math.floor(Date.now() / 1000))
    );

    useEffect(() => {
        if (remaining <= 0) return;
        const interval = setInterval(() => {
            setRemaining(Math.max(0, endTime - Math.floor(Date.now() / 1000)));
        }, 1000);
        return () => clearInterval(interval);
    }, [endTime]);

    const urgency =
        remaining <= 0
            ? 'text-gray-400'
            : remaining <= 60
            ? 'text-red-600 font-bold animate-pulse'
            : remaining <= 300
            ? 'text-orange-500 font-semibold'
            : 'text-green-600 font-semibold';

    return (
        <span className={`text-sm ${urgency} ${className}`}>
            {remaining <= 0 ? 'Voting closed' : `⏱ ${formatDuration(remaining)} left`}
        </span>
    );
};

export default CountdownTimer;
