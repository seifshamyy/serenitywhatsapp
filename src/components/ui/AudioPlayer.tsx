import { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
    url: string;
}

export const AudioPlayer = ({ url }: AudioPlayerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [duration, setDuration] = useState('0:00');
    const [currentTime, setCurrentTime] = useState('0:00');

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!containerRef.current) return;

        wavesurfer.current = WaveSurfer.create({
            container: containerRef.current,
            waveColor: 'rgba(37, 211, 102, 0.5)',
            progressColor: '#25D366',
            cursorColor: 'transparent',
            barWidth: 3,
            barRadius: 3,
            barGap: 2,
            height: 36,
            normalize: true,
        });

        wavesurfer.current.load(url);

        wavesurfer.current.on('ready', () => {
            setIsReady(true);
            setDuration(formatTime(wavesurfer.current?.getDuration() || 0));
        });

        wavesurfer.current.on('audioprocess', () => {
            setCurrentTime(formatTime(wavesurfer.current?.getCurrentTime() || 0));
        });

        wavesurfer.current.on('finish', () => setIsPlaying(false));
        wavesurfer.current.on('error', () => setIsReady(false));

        return () => {
            wavesurfer.current?.destroy();
        };
    }, [url]);

    const togglePlay = () => {
        if (wavesurfer.current && isReady) {
            wavesurfer.current.playPause();
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="flex items-center gap-3 bg-black/40 rounded-xl p-2.5 border border-[#25D366]/20">
            <button
                onClick={togglePlay}
                disabled={!isReady}
                className="w-10 h-10 rounded-full bg-[#25D366] text-black flex items-center justify-center hover:bg-[#1ebc57] transition-all disabled:opacity-50 flex-shrink-0 shadow-[0_0_15px_rgba(37,211,102,0.3)]"
            >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
                <div ref={containerRef} className="w-full" />
                <div className="flex justify-between mt-1 px-1">
                    <span className="text-[10px] text-zinc-400">{isPlaying ? currentTime : '0:00'}</span>
                    <span className="text-[10px] text-zinc-400">{duration}</span>
                </div>
            </div>
        </div>
    );
};
