import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MoreVertical, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ContactEbp } from '../types';

interface ChatHeaderProps {
    contactId: string | null;
    onBack?: () => void;
    showBackButton?: boolean;
}

export const ChatHeader = ({ contactId, onBack, showBackButton }: ChatHeaderProps) => {
    const [contact, setContact] = useState<ContactEbp | null>(null);
    const [aiEnabled, setAiEnabled] = useState(false);
    const [toggling, setToggling] = useState(false);

    const fetchContact = useCallback(async () => {
        if (!contactId) return;
        const { data } = await supabase
            .from('contacts.ebp')
            .select('*')
            .eq('id', contactId)
            .single();

        if (data) {
            const c = data as ContactEbp;
            setContact(c);
            setAiEnabled(c.AI_replies === 'true');
        }
    }, [contactId]);

    useEffect(() => {
        fetchContact();
    }, [fetchContact]);

    const handleToggle = async () => {
        if (!contactId || toggling) return;
        setToggling(true);
        const newState = !aiEnabled;
        setAiEnabled(newState);

        await supabase
            .from('contacts.ebp')
            .update({ AI_replies: newState ? 'true' : 'false' })
            .eq('id', contactId);

        setToggling(false);
    };

    if (!contactId) return null;

    const displayName = contact?.name_WA || `+${contactId}`;

    return (
        <div
            className="px-2 flex items-center justify-between border-b border-[#25D366]/20 bg-[#0a0a0a] flex-shrink-0"
            style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))', paddingBottom: '0.5rem', minHeight: '52px' }}
        >
            <div className="flex items-center gap-2 min-w-0 flex-1">
                {showBackButton && (
                    <button onClick={onBack} className="p-2 -ml-1 rounded-full hover:bg-white/10 text-[#25D366] active:bg-white/20">
                        <ArrowLeft size={22} />
                    </button>
                )}

                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-black" />
                </div>

                <div className="min-w-0 flex-1">
                    <h2 className="text-white font-medium text-sm truncate">{displayName}</h2>
                    {contact?.name_WA && (
                        <p className="text-zinc-500 text-[10px] truncate">+{contactId}</p>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle Switch + AI Label */}
                <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold transition-colors duration-300 ${aiEnabled ? 'text-[#25D366]' : 'text-red-400'}`}>AI</span>

                    <button
                        onClick={handleToggle}
                        disabled={toggling}
                        className="relative flex-shrink-0"
                        style={{
                            width: '38px',
                            height: '22px',
                            borderRadius: '11px',
                            backgroundColor: aiEnabled ? '#25D366' : '#52525b',
                            transition: 'background-color 0.3s',
                            border: '1.5px solid',
                            borderColor: aiEnabled ? '#25D366' : '#71717a',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: '#fff',
                                top: '1.5px',
                                left: aiEnabled ? '18px' : '2px',
                                transition: 'left 0.3s',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
                            }}
                        />
                    </button>
                </div>

                <button className="p-2 rounded-full hover:bg-white/10 text-zinc-400">
                    <MoreVertical size={18} />
                </button>
            </div>
        </div>
    );
};
