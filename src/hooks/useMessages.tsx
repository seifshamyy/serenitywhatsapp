import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { WhatsAppMessage, getContactId } from '../types';

// Per-contact message state
interface ContactData {
    messages: WhatsAppMessage[];
    loading: boolean;
}

type ContactDataMap = Record<string, ContactData>;

interface MessagesContextType {
    contactData: ContactDataMap;
    fetchContactMessages: (contactId: string, silent?: boolean) => Promise<void>;
    clearContactMessages: (contactId: string) => void;
    addOptimisticMessage: (message: Partial<WhatsAppMessage>) => WhatsAppMessage;
}

const MessagesContext = createContext<MessagesContextType | null>(null);

// Singleton channel — survives React StrictMode double-mount
let sharedChannelCreated = false;
// Module-level setter so the singleton realtime callback can always dispatch
let globalSetContactData: React.Dispatch<React.SetStateAction<ContactDataMap>> | null = null;

export const MessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [contactData, setContactData] = useState<ContactDataMap>({});
    const contactDataRef = useRef<ContactDataMap>({});
    contactDataRef.current = contactData;

    // Always keep the module-level setter current
    globalSetContactData = setContactData;

    /**
     * Fetch ALL messages for a contact.
     * - Default: shows loading state and skips if already loaded.
     * - silent=true: background refresh, no loading state, always fetches.
     */
    const fetchContactMessages = useCallback(async (contactId: string, silent = false): Promise<void> => {
        const existing = contactDataRef.current[contactId];
        if (existing?.messages.length > 0 && !existing.loading && !silent) return;

        if (!silent) {
            setContactData((prev: ContactDataMap): ContactDataMap => ({
                ...prev,
                [contactId]: { messages: [], loading: true },
            }));
        }

        try {
            const { data, error } = await supabase
                .from('whatsappserenity')
                .select('*')
                .or(`from.eq.${contactId},to.eq.${contactId}`)
                .order('created_at', { ascending: false })
                .limit(10000);

            if (error) throw error;

            // Reverse to ascending (chronological) order for display
            const messages = (data as WhatsAppMessage[]).reverse();

            setContactData((prev: ContactDataMap): ContactDataMap => ({
                ...prev,
                [contactId]: { messages, loading: false },
            }));
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            console.error('[useMessages] fetchContactMessages error:', msg);
            if (!silent) {
                setContactData((prev: ContactDataMap): ContactDataMap => ({
                    ...prev,
                    [contactId]: { messages: [], loading: false },
                }));
            }
        }
    }, []);

    /** Remove a contact's messages from cache (e.g. after chat deletion). */
    const clearContactMessages = useCallback((contactId: string): void => {
        setContactData((prev: ContactDataMap): ContactDataMap => {
            const next = { ...prev };
            delete next[contactId];
            return next;
        });
    }, []);

    /**
     * Add a message to state optimistically before server confirmation.
     * Only updates if that contact's messages are already loaded.
     */
    const addOptimisticMessage = useCallback((message: Partial<WhatsAppMessage>): WhatsAppMessage => {
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
            status: 'sending',
        };

        const contactId = getContactId(newMsg);
        if (contactId) {
            setContactData((prev: ContactDataMap): ContactDataMap => {
                const existing = prev[contactId];
                if (!existing) return prev;

                const alreadyExists = existing.messages.some(
                    (m: WhatsAppMessage) =>
                        m.id === newMsg.id || (m.mid && newMsg.mid && m.mid === newMsg.mid)
                );
                if (alreadyExists) return prev;

                return { ...prev, [contactId]: { ...existing, messages: [...existing.messages, newMsg] } };
            });
        }

        return newMsg;
    }, []);

    // ─── Singleton Realtime Subscription ──────────────────────────────────────
    useEffect(() => {
        if (sharedChannelCreated) return;
        sharedChannelCreated = true;

        supabase
            .channel('messages-realtime-v9')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'whatsappserenity' },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (payload: any) => {
                    if (!globalSetContactData) return;

                    if (payload.eventType === 'INSERT') {
                        const newMsg = payload.new as WhatsAppMessage;
                        const contactId = getContactId(newMsg);
                        if (!contactId) return;

                        globalSetContactData((prev: ContactDataMap): ContactDataMap => {
                            const existing = prev[contactId];
                            if (!existing) return prev;

                            const existingIdx = existing.messages.findIndex(
                                (m: WhatsAppMessage) =>
                                    m.id === newMsg.id ||
                                    (m.mid && newMsg.mid && m.mid === newMsg.mid) ||
                                    // Match optimistic outgoing message by recipient + type + text
                                    (m.status === 'sending' && !m.mid &&
                                        m.to === newMsg.to && m.type === newMsg.type &&
                                        (m.type !== 'text' || m.text === newMsg.text))
                            );
                            const messages = [...existing.messages];
                            if (existingIdx !== -1) {
                                messages[existingIdx] = { ...newMsg, status: 'sent' };
                            } else {
                                messages.push({ ...newMsg, status: 'sent' });
                            }
                            return { ...prev, [contactId]: { ...existing, messages } };
                        });

                    } else if (payload.eventType === 'UPDATE') {
                        const updatedMsg = payload.new as WhatsAppMessage;
                        const contactId = getContactId(updatedMsg);
                        if (!contactId) return;

                        globalSetContactData((prev: ContactDataMap): ContactDataMap => {
                            const existing = prev[contactId];
                            if (!existing) return prev;
                            return {
                                ...prev,
                                [contactId]: {
                                    ...existing,
                                    messages: existing.messages.map(
                                        (m: WhatsAppMessage) =>
                                            m.id === updatedMsg.id ? { ...updatedMsg, status: 'sent' } : m
                                    ),
                                },
                            };
                        });

                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = (payload.old as { id: number }).id;
                        globalSetContactData((prev: ContactDataMap): ContactDataMap => {
                            const next = { ...prev };
                            for (const cId of Object.keys(next)) {
                                if (next[cId].messages.some((m: WhatsAppMessage) => m.id === deletedId)) {
                                    next[cId] = {
                                        ...next[cId],
                                        messages: next[cId].messages.filter(
                                            (m: WhatsAppMessage) => m.id !== deletedId
                                        ),
                                    };
                                }
                            }
                            return next;
                        });
                    }
                }
            )
            .subscribe((status: string) => {
                console.log('[Realtime] messages channel status:', status);
            });
    }, []);

    return (
        <MessagesContext.Provider value={{ contactData, fetchContactMessages, clearContactMessages, addOptimisticMessage }}>
            {children}
        </MessagesContext.Provider>
    );
};

export const useMessages = (): MessagesContextType => {
    const context = useContext(MessagesContext);
    if (!context) throw new Error('useMessages must be used within a MessagesProvider');
    return context;
};
