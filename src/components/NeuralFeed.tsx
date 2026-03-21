import { useEffect, useRef } from 'react';
import { useMessages } from '../hooks/useMessages';
import { MessageBubble } from './MessageBubble';
import { MessageSquare } from 'lucide-react';

interface NeuralFeedProps {
    selectedChat: string | null;
}

export const NeuralFeed = ({ selectedChat }: NeuralFeedProps) => {
    const { contactData, fetchContactMessages } = useMessages();
    const containerRef = useRef<HTMLDivElement>(null);
    const lastMsgIdRef = useRef<number | string | null>(null);

    const data = selectedChat ? (contactData[selectedChat] ?? { messages: [], loading: false }) : null;
    const messages = data?.messages ?? [];
    const loading = data?.loading ?? false;

    // Fetch all messages when contact is selected (no-op if already cached)
    useEffect(() => {
        if (selectedChat) {
            fetchContactMessages(selectedChat);
        }
    }, [selectedChat, fetchContactMessages]);

    // Silent background refresh when tab regains focus (catches missed realtime events)
    useEffect(() => {
        if (!selectedChat) return;
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                fetchContactMessages(selectedChat, true);
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [selectedChat, fetchContactMessages]);

    // Scroll to bottom on initial load and when new messages arrive
    useEffect(() => {
        if (!containerRef.current || messages.length === 0) return;
        const lastMsg = messages[messages.length - 1];
        const lastId = lastMsg.id ?? lastMsg.mid;

        if (lastId !== lastMsgIdRef.current) {
            const isInitialLoad = lastMsgIdRef.current === null;
            const container = containerRef.current;
            // column-reverse: scrollTop=0 is the bottom (newest messages)
            const isNearBottom = Math.abs(container.scrollTop) < 150;

            if (isInitialLoad || isNearBottom) {
                container.scrollTo({ top: 0, behavior: isInitialLoad ? 'instant' : 'smooth' });
            }
            lastMsgIdRef.current = lastId;
        }
    }, [messages]);

    // Reset scroll tracking when contact changes
    useEffect(() => {
        lastMsgIdRef.current = null;
    }, [selectedChat]);

    if (!selectedChat) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-serenity-light flex items-center justify-center mx-auto mb-6 border border-serenity-light shadow-sm">
                        <MessageSquare size={40} className="text-serenity-teal" />
                    </div>
                    <h3 className="text-slate-900 text-2xl font-bold mb-2">Serenity</h3>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">
                        Ready to assist. Select a conversation to manage your outreach.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-serenity-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2.5 h-2.5 bg-serenity-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2.5 h-2.5 bg-serenity-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-4 py-6"
            style={{
                display: 'flex',
                flexDirection: 'column-reverse',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2364748b' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C%2Fg%3E%3C%2Fsvg%3E")`,
                backgroundColor: '#f8fafc',
            }}
        >
            <div className="space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-slate-200/50">
                            <div className="text-5xl mb-4">✨</div>
                            <p className="text-slate-500 font-medium italic">Start the conversation</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble key={msg.id ?? msg.mid} message={msg} />
                    ))
                )}
            </div>
        </div>
    );
};
