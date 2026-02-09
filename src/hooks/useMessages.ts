import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { WhatsAppMessage } from '../types';

export const useMessages = () => {
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMessages = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('whatsappebp')
                .select('*')
                .order('created_at', { ascending: true }); // Order by timestamp

            if (error) throw error;
            setMessages(data as WhatsAppMessage[]);
        } catch (err: any) {
            console.error('Fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Add message locally (for immediate UI update)
    const addLocalMessage = useCallback((message: Partial<WhatsAppMessage>) => {
        const newMsg: WhatsAppMessage = {
            id: message.id || Date.now(),
            type: (message.type as WhatsAppMessage['type']) || 'text',
            from: message.from ?? null,
            to: message.to ?? null,
            text: message.text ?? null,
            media_url: message.media_url ?? null,
            is_reply: message.is_reply ?? null,
            reply_to_mid: message.reply_to_mid ?? null,
            mid: message.mid ?? null,
            created_at: message.created_at || new Date().toISOString(),
        };

        setMessages((prev) => {
            const exists = prev.some(
                (m) => m.id === newMsg.id || (m.mid && m.mid === newMsg.mid)
            );
            if (exists) return prev;
            return [...prev, newMsg];
        });

        return newMsg;
    }, []);

    useEffect(() => {
        fetchMessages();

        // Poll every 2 seconds
        const pollInterval = setInterval(() => {
            fetchMessages();
        }, 2000);

        // Real-time subscription (backup)
        const channel = supabase
            .channel('messages-realtime-v3')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'whatsappebp' },
                (payload) => {
                    setMessages((prev) => {
                        const exists = prev.some(
                            (m) => m.id === payload.new.id || (m.mid && m.mid === payload.new.mid)
                        );
                        if (exists) return prev;
                        return [...prev, payload.new as WhatsAppMessage];
                    });
                }
            )
            .subscribe();

        return () => {
            clearInterval(pollInterval);
            supabase.removeChannel(channel);
        };
    }, [fetchMessages]);

    return { messages, loading, error, addLocalMessage, refetch: fetchMessages };
};
