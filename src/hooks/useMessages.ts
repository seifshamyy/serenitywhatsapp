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
                .from('whatsappbuongo')
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

    // Add optimistic message (for immediate UI update)
    const addOptimisticMessage = useCallback((message: Partial<WhatsAppMessage>) => {
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
            status: 'sending'
        };

        setMessages((prev) => {
            // Check if it already exists (by ID or MID)
            const exists = prev.some(
                (m) => m.id === newMsg.id || (m.mid && newMsg.mid && m.mid === newMsg.mid)
            );
            if (exists) return prev;
            return [...prev, newMsg];
        });

        return newMsg;
    }, []);

    useEffect(() => {
        fetchMessages();

        // Poll every 3 seconds (less aggressive)
        const pollInterval = setInterval(() => {
            fetchMessages();
        }, 3000);

        // Real-time subscription
        const channel = supabase
            .channel('messages-realtime-v3')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'whatsappbuongo' },
                (payload) => {
                    const newMsg = payload.new as WhatsAppMessage;
                    setMessages((prev) => {
                        // If we have an optimistic message with the same MID, replace it
                        // Or if we have a duplicate by ID
                        const existingIndex = prev.findIndex(
                            (m) => m.id === newMsg.id || (m.mid && newMsg.mid && m.mid === newMsg.mid)
                        );

                        if (existingIndex !== -1) {
                            // Update existing (optimistic) message with real data
                            // Preserving the optimistic one's index is usually good, 
                            // but since we sort by date in render, replacing is fine.
                            const updated = [...prev];
                            updated[existingIndex] = { ...newMsg, status: 'sent' };
                            return updated;
                        }

                        return [...prev, { ...newMsg, status: 'sent' }];
                    });
                }
            )
            .subscribe();

        return () => {
            clearInterval(pollInterval);
            supabase.removeChannel(channel);
        };
    }, [fetchMessages]);

    return { messages, loading, error, addOptimisticMessage, refetch: fetchMessages };
};
