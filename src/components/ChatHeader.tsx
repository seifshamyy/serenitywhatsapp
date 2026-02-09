import { useState } from 'react';
import { MoreVertical, ArrowLeft, User } from 'lucide-react';

interface ChatHeaderProps {
    contactId: string | null;
    onBack?: () => void;
    showBackButton?: boolean;
    isEnabled?: boolean;
    onToggle?: (enabled: boolean) => void;
}

export const ChatHeader = ({ contactId, onBack, showBackButton, isEnabled = true, onToggle }: ChatHeaderProps) => {
    const [enabled, setEnabled] = useState(isEnabled);

    const handleToggle = () => {
        const newState = !enabled;
        setEnabled(newState);
        onToggle?.(newState);
    };

    if (!contactId) return null;

    return (
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#25D366]/20 bg-gradient-to-r from-[#0a0a0a] to-[#0f0f0f]">
            <div className="flex items-center gap-3">
                {showBackButton && (
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/5 text-[#25D366] md:hidden transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                )}

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-[0_0_15px_rgba(37,211,102,0.3)]">
                    <User size={20} className="text-black" />
                </div>

                {/* Info */}
                <div>
                    <h2 className="text-white font-medium text-sm">+{contactId}</h2>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {/* Toggle Switch */}
                <button
                    onClick={handleToggle}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${enabled
                        ? 'bg-[#25D366] shadow-[0_0_15px_rgba(37,211,102,0.4)]'
                        : 'bg-zinc-700'
                        }`}
                >
                    <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${enabled ? 'left-[26px]' : 'left-0.5'
                            }`}
                    />
                </button>

                <button className="p-2.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-[#25D366] transition-colors">
                    <MoreVertical size={20} />
                </button>
            </div>
        </div>
    );
};
