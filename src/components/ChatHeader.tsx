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
            className="px-2 flex items-center justify-between border-b border-slate-200 bg-white flex-shrink-0"
            style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))', paddingBottom: '0.5rem', minHeight: '52px' }}
        >
            <div className="flex items-center gap-2 min-w-0 flex-1">
                {showBackButton && (
                    <button onClick={onBack} className="p-2 -ml-1 rounded-full hover:bg-slate-100 text-red-500 active:bg-slate-200">
                        <ArrowLeft size={22} />
                    </button>
                )}

                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User size={18} className="text-white" />
                </div>

                <div className="min-w-0 flex-1 ml-1">
                    <h2 className="text-slate-900 font-bold text-sm truncate">{displayName}</h2>
                    {contact?.name_WA && (
                        <p className="text-slate-500 text-[10px] truncate">+{contactId}</p>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle Switch + AI Label */}
                <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold transition-colors duration-300 ${aiEnabled ? 'text-red-500' : 'text-slate-400'}`}>AI</span>

                    <button
                        onClick={handleToggle}
                        disabled={toggling}
                        className="relative flex-shrink-0 self-center"
                        style={{
                            width: '38px',
                            height: '22px',
                            minHeight: '22px',
                            maxHeight: '22px',
                            borderRadius: '11px',
                            backgroundColor: aiEnabled ? '#ef4444' : '#e2e8f0',
                            transition: 'background-color 0.3s',
                            border: '1.5px solid',
                            borderColor: aiEnabled ? '#ef4444' : '#cbd5e1',
                            overflow: 'hidden',
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
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }}
                        />
                    </button>
                </div>

                <button className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
                    <MoreVertical size={18} />
                </button>
            </div>
        </div>
    );
};
