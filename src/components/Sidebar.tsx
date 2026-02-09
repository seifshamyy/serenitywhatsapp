import { MessageSquare, Users, Settings, Activity, Radio, Phone } from 'lucide-react';

export const Sidebar = () => {
    const navItems = [
        { icon: MessageSquare, label: 'Feed', active: true },
        { icon: Users, label: 'Contacts', active: false },
        { icon: Activity, label: 'Analytics', active: false },
        { icon: Radio, label: 'Broadcast', active: false },
        { icon: Phone, label: 'Calls', active: false },
        { icon: Settings, label: 'System', active: false },
    ];

    return (
        <div className="hidden md:flex flex-col w-20 h-screen bg-black/90 border-r border-glass z-50 items-center py-8 gap-8 backdrop-blur-xl">
            <div className="text-whatsapp-green filter drop-shadow-[0_0_8px_rgba(37,211,102,0.8)]">
                <Activity size={32} />
            </div>

            <div className="flex flex-col gap-6 flex-1 w-full items-center">
                {navItems.map((item, idx) => (
                    <button
                        key={idx}
                        className={`p-3 rounded-xl transition-all duration-300 relative group ${item.active
                                ? 'text-whatsapp-green bg-whatsapp-green/10 shadow-[0_0_15px_rgba(37,211,102,0.2)]'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                            }`}
                    >
                        <item.icon size={24} />
                        {item.active && (
                            <div className="absolute inset-y-0 -right-[18px] w-1 bg-whatsapp-green rounded-l-full shadow-[0_0_10px_#25D366]" />
                        )}

                        {/* Tooltip */}
                        <div className="absolute left-14 bg-black border border-glass text-whatsapp-green text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-neon">
                            {item.label}
                        </div>
                    </button>
                ))}
            </div>

            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-whatsapp-green to-black border border-whatsapp-green/50 shadow-neon" />
        </div>
    );
};
