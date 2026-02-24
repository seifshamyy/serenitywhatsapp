import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { WhatsAppMessage } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface MessagesContextType {
    messages: WhatsAppMessage[];
    loading: boolean;
    error: string | null;
    addOptimisticMessage: (message: Partial<WhatsAppMessage>) => WhatsAppMessage;
    refetch: () => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | null>(null);

// Module-level singleton channel
let sharedChannel: RealtimeChannel | null = null;

export const MessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const setMessagesRef = useRef(setMessages);
    setMessagesRef.current = setMessages;

    const fetchMessages = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('whatsappbuongo')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessagesRef.current(data as WhatsAppMessage[]);
        } catch (err: any) {
            console.error('Fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

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

        if (!sharedChannel) {
            sharedChannel = supabase
                .channel('messages-realtime-v6')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'whatsappbuongo' },
                    (payload) => {
                        console.log('[Realtime] message event:', payload.eventType);
                        if (payload.eventType === 'INSERT') {
                            const newMsg = payload.new as WhatsAppMessage;
                            setMessagesRef.current((prev) => {
                                const existingIndex = prev.findIndex(
                                    (m) => m.id === newMsg.id || (m.mid && newMsg.mid && m.mid === newMsg.mid)
                                );
                                if (existingIndex !== -1) {
                                    const updated = [...prev];
                                    updated[existingIndex] = { ...newMsg, status: 'sent' };
                                    return updated;
                                }
                                return [...prev, { ...newMsg, status: 'sent' }];
                            });
                        } else if (payload.eventType === 'UPDATE') {
                            const updatedMsg = payload.new as WhatsAppMessage;
                            setMessagesRef.current((prev) =>
                                prev.map((m) =>
                                    m.id === updatedMsg.id ? { ...updatedMsg, status: 'sent' } : m
                                )
                            );
                        } else if (payload.eventType === 'DELETE') {
                            const deletedId = (payload.old as any).id;
                            setMessagesRef.current((prev) => prev.filter((m) => m.id !== deletedId));
                        }
                    }
                )
                .subscribe((status) => {
                    console.log('[Realtime] messages channel status:', status);
                });
        }

        return () => {
            // Don't remove the singleton channel — it persists for the app lifetime
        };
    }, [fetchMessages]);

    const value: MessagesContextType = {
        messages,
        loading,
        error,
        addOptimisticMessage,
        refetch: fetchMessages,
    };

    return (
        <MessagesContext.Provider value= { value } >
        { children }
        </MessagesContext.Provider>
    );
};

// Drop-in replacement for the old useMessages hook
export const useMessages = (): MessagesContextType => {
    const context = useContext(MessagesContext);
    if (!context) {
        throw new Error('useMessages must be used within a MessagesProvider');
    }
    return context;
};
