import { useState } from 'react';
import { WhatsAppMessage, isOutgoing } from '../types';
import { AudioPlayer } from './ui/AudioPlayer';
import { CheckCheck, Clock, X, Download, ZoomIn } from 'lucide-react';

interface MessageBubbleProps {
    message: WhatsAppMessage;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
    const isOwn = isOutgoing(message);
    const [showImageModal, setShowImageModal] = useState(false);

    // Detect RTL text (Arabic)
    const isRTL = message.text && /[\u0600-\u06FF]/.test(message.text);

    // Format timestamp
    const formatTime = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    // Download image
    const handleDownload = async () => {
        if (!message.media_url) return;
        try {
            const response = await fetch(message.media_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `image_${message.id || Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            // Fallback: open in new tab
            window.open(message.media_url, '_blank');
        }
    };

    return (
        <>
            <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                    className={`
            relative max-w-[80%] md:max-w-[65%] px-3 py-2 rounded-xl
            transition-all duration-200
            ${isOwn
                            ? 'bg-gradient-to-br from-[#005c4b] to-[#004a3d] rounded-br-sm shadow-[0_2px_8px_rgba(0,92,75,0.3)]'
                            : 'bg-gradient-to-br from-[#1f2c33] to-[#1a252b] rounded-bl-sm shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                        }
          `}
                    dir={isRTL ? 'rtl' : 'ltr'}
                >
                    {/* Reply Indicator */}
                    {message.is_reply === 'true' && message.reply_to_mid && (
                        <div className="mb-2 px-2 py-1.5 rounded-lg bg-black/30 border-l-2 border-[#25D366] text-xs text-zinc-400">
                            ↩️ Reply
                        </div>
                    )}

                    {/* Image - Clickable */}
                    {message.type === 'image' && message.media_url && (
                        <div
                            className="mb-2 rounded-lg overflow-hidden -mx-1 -mt-1 shadow-lg cursor-pointer relative group"
                            onClick={() => setShowImageModal(true)}
                        >
                            <img
                                src={message.media_url}
                                alt="Media"
                                className="w-full max-w-sm h-auto object-cover rounded-lg transition-transform group-hover:scale-[1.02]"
                                loading="lazy"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <ZoomIn size={32} className="text-white drop-shadow-lg" />
                            </div>
                        </div>
                    )}

                    {/* Audio */}
                    {message.type === 'audio' && message.media_url && (
                        <div className="min-w-[220px] md:min-w-[280px]">
                            <AudioPlayer url={message.media_url} />
                        </div>
                    )}

                    {/* Video */}
                    {message.type === 'video' && message.media_url && (
                        <div className="mb-2 rounded-lg overflow-hidden -mx-1 -mt-1 shadow-lg">
                            <video
                                src={message.media_url}
                                controls
                                className="w-full max-w-sm h-auto rounded-lg"
                            />
                        </div>
                    )}

                    {/* Text */}
                    {message.text && (
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-white/95">
                            {message.text}
                        </p>
                    )}

                    {/* Timestamp & Status */}
                    <div className={`flex items-center gap-1.5 mt-1.5 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                        <span className="text-[10px] text-white/40 font-light">
                            {formatTime(message.created_at)}
                        </span>
                        {isOwn && (
                            message.mid ? (
                                <CheckCheck size={14} className="text-[#53bdeb]" />
                            ) : (
                                <Clock size={12} className="text-white/40" />
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Image Modal / Lightbox */}
            {showImageModal && message.media_url && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setShowImageModal(false)}
                >
                    {/* Close button */}
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        onClick={() => setShowImageModal(false)}
                    >
                        <X size={24} />
                    </button>

                    {/* Download button */}
                    <button
                        className="absolute top-4 left-4 px-4 py-2 rounded-full bg-[#25D366] hover:bg-[#1ebc57] text-black font-medium text-sm flex items-center gap-2 transition-colors shadow-lg"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownload();
                        }}
                    >
                        <Download size={18} />
                        Download
                    </button>

                    {/* Image */}
                    <img
                        src={message.media_url}
                        alt="Full size"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
};
