import { useRef, useState, useCallback, useEffect } from 'react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    /** For column-reverse containers (like chat feeds) */
    isReversed?: boolean;
    /** Ref forwarding for the scrollable container */
    containerRef?: React.RefObject<HTMLDivElement>;
}

const THRESHOLD = 80; // Pull distance to trigger refresh
const MAX_PULL = 120; // Max visual pull distance
const RESISTANCE = 0.4; // Resistance factor for overscroll

export const PullToRefresh = ({
    onRefresh,
    children,
    className = '',
    style,
    isReversed = false,
    containerRef: externalRef,
}: PullToRefreshProps) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const scrollRef = externalRef || internalRef;
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showIndicator, setShowIndicator] = useState(false);
    const touchStartY = useRef(0);
    const isPulling = useRef(false);

    const isAtTop = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return false;
        if (isReversed) {
            // column-reverse: fully scrolled "up" means scrollTop is at most negative
            return Math.abs(el.scrollTop + el.scrollHeight - el.clientHeight) < 5;
        }
        return el.scrollTop <= 0;
    }, [isReversed, scrollRef]);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (isRefreshing) return;
        if (isAtTop()) {
            touchStartY.current = e.touches[0].clientY;
            isPulling.current = true;
        }
    }, [isRefreshing, isAtTop]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isPulling.current || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStartY.current;

        // Only allow pulling down
        if (diff > 0 && isAtTop()) {
            // Apply resistance
            const distance = Math.min(diff * RESISTANCE, MAX_PULL);
            setPullDistance(distance);
            setShowIndicator(true);

            // Prevent default scroll while pulling
            if (distance > 10) {
                e.preventDefault();
            }
        } else {
            setPullDistance(0);
            setShowIndicator(false);
        }
    }, [isRefreshing, isAtTop]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling.current) return;
        isPulling.current = false;

        if (pullDistance >= THRESHOLD * RESISTANCE) {
            // Trigger refresh
            setIsRefreshing(true);
            setPullDistance(50); // Hold at indicator position
            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
                setShowIndicator(false);
            }
        } else {
            // Spring back
            setPullDistance(0);
            setTimeout(() => setShowIndicator(false), 300);
        }
    }, [pullDistance, onRefresh]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchmove', handleTouchMove, { passive: false });
        el.addEventListener('touchend', handleTouchEnd);

        return () => {
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchmove', handleTouchMove);
            el.removeEventListener('touchend', handleTouchEnd);
        };
    }, [scrollRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

    const progress = Math.min(pullDistance / (THRESHOLD * RESISTANCE), 1);
    const rotation = pullDistance * 4; // Spin the arrow

    return (
        <div className={`relative ${className}`} style={style}>
            {/* Pull indicator */}
            {showIndicator && (
                <div
                    className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-50"
                    style={{
                        top: isReversed ? 'auto' : 0,
                        bottom: isReversed ? 0 : 'auto',
                        height: `${Math.max(pullDistance, 0)}px`,
                        transition: isPulling.current ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <div
                        className="flex items-center justify-center"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: isRefreshing
                                ? 'linear-gradient(135deg, #10b981, #059669)'
                                : `linear-gradient(135deg, rgba(16,185,129,${0.15 + progress * 0.85}), rgba(5,150,105,${0.15 + progress * 0.85}))`,
                            backdropFilter: 'blur(8px)',
                            boxShadow: isRefreshing
                                ? '0 4px 15px rgba(16,185,129,0.4)'
                                : `0 2px 10px rgba(16,185,129,${progress * 0.3})`,
                            transform: `scale(${0.5 + progress * 0.5})`,
                            opacity: Math.min(progress * 2, 1),
                            transition: isPulling.current
                                ? 'none'
                                : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        {isRefreshing ? (
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                style={{ animation: 'ptr-spin 0.8s linear infinite' }}
                            >
                                <circle
                                    cx="12" cy="12" r="9"
                                    stroke="white"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeDasharray="42"
                                    strokeDashoffset="14"
                                />
                            </svg>
                        ) : (
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                style={{
                                    transform: `rotate(${rotation}deg)`,
                                    transition: isPulling.current ? 'none' : 'transform 0.3s ease',
                                }}
                            >
                                <path
                                    d="M12 4V20M12 20L6 14M12 20L18 14"
                                    stroke={progress >= 1 ? 'white' : `rgba(16,185,129,${0.5 + progress * 0.5})`}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        )}
                    </div>
                </div>
            )}

            {/* Content with pull transform */}
            <div
                ref={externalRef ? undefined : internalRef}
                className={`h-full overflow-y-auto ${className}`}
                style={{
                    ...style,
                    transform: showIndicator ? `translateY(${pullDistance}px)` : 'none',
                    transition: isPulling.current ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    touchAction: 'pan-y',
                    willChange: showIndicator ? 'transform' : 'auto',
                }}
            >
                {children}
            </div>

            {/* Keyframe animation for spinner */}
            <style>{`
                @keyframes ptr-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
