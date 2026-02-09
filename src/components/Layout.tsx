interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="flex h-screen w-screen bg-black overflow-hidden">
            {/* Ambient Glow Effects */}
            <div className="fixed top-0 left-0 w-96 h-96 bg-[#25D366]/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#25D366]/5 rounded-full blur-[150px] pointer-events-none" />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full w-full relative z-10">
                {/* Header */}
                <header className="h-14 border-b border-[#25D366]/20 flex items-center justify-between px-4 md:px-6 bg-black/80 backdrop-blur-sm flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#25D366] rounded-full shadow-[0_0_10px_#25D366] animate-pulse" />
                        <h1 className="text-sm md:text-base font-mono tracking-wider text-[#25D366]/90">
                            EBP Command Center
                        </h1>
                    </div>
                    <span className="text-[10px] md:text-xs font-mono text-zinc-500 hidden sm:block">
                        SECURE CONNECTION
                    </span>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
};
