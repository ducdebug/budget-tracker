'use client';

function Shimmer({ className = '' }: { className?: string }) {
    return (
        <div
            className={`animate-pulse rounded-2xl bg-gradient-to-r from-muted/60 via-muted to-muted/60 ${className}`}
            style={{
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite',
            }}
        />
    );
}

export function HomeSkeletonLoader() {
    return (
        <div className="space-y-4 px-6 py-4 animate-in fade-in duration-200">
            <div className="flex gap-3">
                <div className="flex-1 rounded-3xl p-5 border-2 border-dashed border-muted bg-blue-50/50 space-y-3">
                    <div className="flex justify-center">
                        <Shimmer className="w-14 h-14 rounded-full" />
                    </div>
                    <div className="space-y-2 flex flex-col items-center">
                        <Shimmer className="h-3 w-16 rounded-lg" />
                        <Shimmer className="h-7 w-24 rounded-lg" />
                    </div>
                    <div className="flex gap-4 justify-center">
                        <Shimmer className="h-8 w-14 rounded-xl" />
                        <Shimmer className="h-8 w-14 rounded-xl" />
                    </div>
                </div>
                <div className="flex-1 rounded-3xl p-5 border-2 border-dashed border-muted bg-pink-50/50 space-y-3">
                    <div className="flex justify-center">
                        <Shimmer className="w-14 h-14 rounded-full" />
                    </div>
                    <div className="space-y-2 flex flex-col items-center">
                        <Shimmer className="h-3 w-16 rounded-lg" />
                        <Shimmer className="h-7 w-24 rounded-lg" />
                    </div>
                    <div className="flex gap-4 justify-center">
                        <Shimmer className="h-8 w-14 rounded-xl" />
                        <Shimmer className="h-8 w-14 rounded-xl" />
                    </div>
                </div>
            </div>

            <div className="px-0 py-2">
                <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                        <Shimmer className="w-5 h-5 rounded-md" />
                        <Shimmer className="h-5 w-20 rounded-lg" />
                    </div>
                    <div className="flex justify-center">
                        <Shimmer className="h-9 w-32 rounded-lg" />
                    </div>
                    <div className="flex justify-center">
                        <Shimmer className="h-8 w-28 rounded-full" />
                    </div>
                    <Shimmer className="h-10 w-full rounded-2xl" />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Shimmer className="h-5 w-36 rounded-lg" />
                    <Shimmer className="h-4 w-16 rounded-lg" />
                </div>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3">
                        <Shimmer className="w-10 h-10 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <Shimmer className="h-3.5 w-2/3 rounded-lg" />
                            <Shimmer className="h-2.5 w-1/3 rounded-lg" />
                        </div>
                        <Shimmer className="h-4 w-16 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function StatsSkeletonLoader() {
    return (
        <div className="px-6 py-4 space-y-6 animate-in fade-in duration-200">
            <Shimmer className="h-6 w-24 rounded-lg" />

            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <Shimmer className="h-4 w-40 rounded-lg" />
                    <Shimmer className="h-6 w-16 rounded-full" />
                </div>
                <div className="flex justify-center">
                    <Shimmer className="h-7 w-32 rounded-lg" />
                </div>
                <div className="flex justify-center">
                    <Shimmer className="w-[180px] h-[180px] rounded-full" />
                </div>
                {[1, 2, 3].map(i => (
                    <div key={i} className="p-2.5 rounded-xl bg-muted/40">
                        <div className="flex items-center gap-2">
                            <Shimmer className="w-3 h-3 rounded-full flex-shrink-0" />
                            <Shimmer className="h-3 w-1/3 rounded-lg" />
                            <div className="flex-1" />
                            <Shimmer className="h-3 w-16 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DebtSkeletonLoader() {
    return (
        <div className="px-6 py-4 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
                <Shimmer className="h-6 w-24 rounded-lg" />
                <Shimmer className="h-8 w-24 rounded-full" />
            </div>
            {[1, 2].map(group => (
                <div key={group} className="space-y-3">
                    <Shimmer className="h-4 w-28 rounded-lg" />
                    <div className="bg-card rounded-2xl p-3 border border-border shadow-sm space-y-2">
                        {[1, 2].map(i => (
                            <div key={i} className="flex items-center gap-3 p-2">
                                <Shimmer className="w-9 h-9 rounded-full flex-shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <Shimmer className="h-3.5 w-1/2 rounded-lg" />
                                    <Shimmer className="h-2.5 w-1/3 rounded-lg" />
                                </div>
                                <Shimmer className="h-4 w-20 rounded-lg" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
