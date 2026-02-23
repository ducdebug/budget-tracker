'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 130;
const RESISTANCE = 2.5;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [showIndicator, setShowIndicator] = useState(false);

    const startY = useRef(0);
    const currentY = useRef(0);
    const pulling = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const canPull = useCallback(() => {
        return window.scrollY <= 0;
    }, []);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (refreshing) return;
        if (!canPull()) return;

        startY.current = e.touches[0].clientY;
        pulling.current = true;
    }, [refreshing, canPull]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!pulling.current || refreshing) return;

        currentY.current = e.touches[0].clientY;
        const delta = currentY.current - startY.current;

        if (delta > 0 && canPull()) {
            const distance = Math.min(delta / RESISTANCE, MAX_PULL);
            setPullDistance(distance);
            setShowIndicator(true);
            if (distance > 5) {
                e.preventDefault();
            }
        } else {
            pulling.current = false;
            setPullDistance(0);
            setShowIndicator(false);
        }
    }, [refreshing, canPull]);

    const handleTouchEnd = useCallback(async () => {
        if (!pulling.current) return;
        pulling.current = false;

        if (pullDistance >= PULL_THRESHOLD / RESISTANCE && !refreshing) {
            setRefreshing(true);
            setPullDistance(PULL_THRESHOLD / RESISTANCE);

            try {
                await onRefresh();
            } catch (error) {
                console.error('Refresh failed:', error);
            }

            setRefreshing(false);
        }

        setPullDistance(0);
        setTimeout(() => setShowIndicator(false), 300);
    }, [pullDistance, refreshing, onRefresh]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    const isTriggered = pullDistance >= PULL_THRESHOLD / RESISTANCE;
    const rotation = Math.min(pullDistance / (PULL_THRESHOLD / RESISTANCE) * 360, 360);
    const opacity = Math.min(pullDistance / (PULL_THRESHOLD / RESISTANCE), 1);
    const scale = 0.5 + Math.min(pullDistance / (PULL_THRESHOLD / RESISTANCE), 1) * 0.5;

    return (
        <div ref={containerRef} className="relative">
            <div
                className="absolute left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
                style={{
                    top: 0,
                    height: `${pullDistance}px`,
                    opacity: showIndicator ? opacity : 0,
                    transition: pulling.current ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                }}
            >
                <div
                    className={`flex flex-col items-center gap-1 ${isTriggered || refreshing ? 'text-primary' : 'text-muted-foreground'}`}
                    style={{
                        transform: `scale(${scale})`,
                        transition: pulling.current ? 'none' : 'transform 0.3s ease',
                    }}
                >
                    <div
                        className={refreshing ? 'animate-spin' : ''}
                        style={{
                            transform: refreshing ? undefined : `rotate(${rotation}deg)`,
                            transition: pulling.current ? 'none' : 'transform 0.3s ease',
                        }}
                    >
                        <RefreshCw size={22} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wide">
                        {refreshing
                            ? 'Đang tải...'
                            : isTriggered
                                ? 'Thả để làm mới'
                                : 'Kéo xuống để làm mới'}
                    </span>
                </div>
            </div>
            <div
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: pulling.current ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {children}
            </div>
        </div>
    );
}
