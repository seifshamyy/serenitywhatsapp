import { useState, useRef, useCallback } from 'react';
import { Send, Mic, Paperclip, Smile, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OutboundHubProps {
    recipientId: string | null;
    onMessageSent?: (message: any) => void;
}

// WhatsApp Business Cloud API Configuration
const WHATSAPP_API_URL = 'https://graph.facebook.com/v24.0/945506158652044/messages';
const WHATSAPP_TOKEN = 'EAAQner4PitoBQuvtZAwE2vf5WraJrJTap2jSDc8wdHMnwI3siliqeZAXu0CsgXShUIIyTi19H2SONoLgqWbiUngU7wolXRdk7XQJGQ4PcjGDpU1fieT7tmniPiwt3qGhYWaufrxspnrZCR6QWPzBjaSAzr6579X50HzybntCduIaDTZCc7bhYzIlO1W3pwhaFQZDZD';

// Webhook URL
const WEBHOOK_URL = 'https://primary-production-9e01d.up.railway.app/webhook/088deb01-e2d3-45f7-8008-1e1939b2cbe7';

// Supabase Storage
const SUPABASE_STORAGE_URL = 'https://whmbrguzumyatnslzfsq.supabase.co/storage/v1/object/public/TREE';

// Generate random ID (1 to 1 billion)
const generateRandomId = () => Math.floor(Math.random() * 1000000000) + 1;

// POST to webhook
const postToWebhook = async (mid: string, data: string, type: string, to: string) => {
    try {
        const payload = { mid, data, type, id: generateRandomId(), to };
        console.log('Posting to webhook:', payload);
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            mode: 'no-cors'
        });
    } catch (err) {
        console.error('Webhook error:', err);
    }
};

// Send text via WhatsApp API
const sendWhatsAppText = async (to: string, text: string) => {
    const response = await fetch(WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { preview_url: false, body: text },
        }),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Failed to send');
    }
    return response.json();
};

// Send image via WhatsApp API
const sendWhatsAppImage = async (to: string, imageUrl: string, caption?: string) => {
    const response = await fetch(WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'image',
            image: { link: imageUrl, caption: caption || '' },
        }),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Failed to send image');
    }
    return response.json();
};

// Send audio via WhatsApp API
const sendWhatsAppAudio = async (to: string, audioUrl: string) => {
    const response = await fetch(WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'audio',
            audio: { link: audioUrl },
        }),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Failed to send audio');
    }
    return response.json();
};

// Upload file to Supabase Storage
const uploadToStorage = async (file: File | Blob, fileName: string): Promise<string> => {
    const { data, error } = await supabase.storage
        .from('TREE')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) throw new Error(`Upload failed: ${error.message}`);
    return `${SUPABASE_STORAGE_URL}/${data.path}`;
};

// Store message in database - with 'to' field
const storeMessage = async (
    type: string,
    text: string | null,
    mediaUrl: string | null,
    mid: string,
    toNumber: string
) => {
    const insertData = {
        type,
        text,
        media_url: mediaUrl,
        from: null, // null = sent from our account
        to: toNumber,
        is_reply: 'false',
        mid,
        created_at: new Date().toISOString(), // Add timestamp
    };

    console.log('Storing message:', insertData);

    const { data, error } = await supabase.from('whatsappebp').insert(insertData).select();

    if (error) {
        console.error('DB store failed:', error);
        throw new Error(`DB error: ${error.message}`);
    }

    console.log('Message stored:', data);
    return data?.[0];
};

export const OutboundHub = ({ recipientId, onMessageSent }: OutboundHubProps) => {
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);

    // Audio recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<number | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Send recorded audio - extracted as separate function
    const sendAudioMessage = useCallback(async (audioBlob: Blob) => {
        if (!recipientId) return;

        console.log('Sending audio message, blob size:', audioBlob.size);
        setSending(true);
        setError(null);

        try {
            const fileName = `${generateRandomId()}_recording.ogg`;
            console.log('Uploading audio to storage...');
            const mediaUrl = await uploadToStorage(audioBlob, fileName);
            console.log('Uploaded to:', mediaUrl);

            console.log('Sending to WhatsApp...');
            const apiResponse = await sendWhatsAppAudio(recipientId, mediaUrl);
            console.log('WhatsApp response:', apiResponse);

            const mid = apiResponse.messages?.[0]?.id || `audio_${Date.now()}`;

            console.log('Storing in database...');
            const storedMsg = await storeMessage('audio', null, mediaUrl, mid, recipientId);

            console.log('Posting to webhook...');
            await postToWebhook(mid, mediaUrl, 'audio', recipientId);

            // Trigger UI update
            if (onMessageSent) {
                onMessageSent({
                    id: storedMsg?.id || Date.now(),
                    type: 'audio',
                    text: null,
                    media_url: mediaUrl,
                    from: null,
                    to: recipientId,
                    mid,
                });
            }

            console.log('Audio message sent successfully!');
        } catch (err: any) {
            console.error('Audio send error:', err);
            setError(err.message);
            setTimeout(() => setError(null), 5000);
        } finally {
            setSending(false);
        }
    }, [recipientId, onMessageSent]);

    // Start audio recording
    const startRecording = async () => {
        try {
            console.log('Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // WhatsApp supports: audio/ogg, audio/mpeg, audio/amr
            // Try ogg first (best WhatsApp compatibility), then fallback
            let mimeType = 'audio/ogg;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm;codecs=opus';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/webm';
                }
            }
            console.log('Using mime type:', mimeType);

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                console.log('Audio data available, size:', e.data.size);
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                console.log('Recording stopped, chunks:', audioChunksRef.current.length);
                stream.getTracks().forEach(track => track.stop());

                if (audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg' });
                    console.log('Created audio blob, size:', audioBlob.size);
                    sendAudioMessage(audioBlob);
                } else {
                    setError('No audio recorded');
                    setTimeout(() => setError(null), 3000);
                }
            };

            mediaRecorder.start(100); // Collect data every 100ms
            setIsRecording(true);
            setRecordingTime(0);

            recordingIntervalRef.current = window.setInterval(() => {
                setRecordingTime(t => t + 1);
            }, 1000);

            console.log('Recording started');
        } catch (err: any) {
            console.error('Recording error:', err);
            setError('Microphone access denied: ' + err.message);
            setTimeout(() => setError(null), 3000);
        }
    };

    // Stop recording
    const stopRecording = () => {
        console.log('Stopping recording...');
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSend = async () => {
        if ((!input.trim() && !selectedFile) || !recipientId) return;

        setSending(true);
        setError(null);

        try {
            let apiResponse;
            let msgType = 'text';
            let mediaUrl: string | null = null;
            let dataForWebhook: string;

            if (selectedFile) {
                const fileName = `${generateRandomId()}_${selectedFile.name}`;
                mediaUrl = await uploadToStorage(selectedFile, fileName);

                if (selectedFile.type.startsWith('image/')) {
                    msgType = 'image';
                    apiResponse = await sendWhatsAppImage(recipientId, mediaUrl, input.trim() || undefined);
                    dataForWebhook = mediaUrl;
                } else if (selectedFile.type.startsWith('audio/')) {
                    msgType = 'audio';
                    apiResponse = await sendWhatsAppAudio(recipientId, mediaUrl);
                    dataForWebhook = mediaUrl;
                } else {
                    throw new Error('Unsupported file type');
                }

                const mid = apiResponse.messages?.[0]?.id || `${msgType}_${Date.now()}`;
                const storedMsg = await storeMessage(msgType, input.trim() || null, mediaUrl, mid, recipientId);
                await postToWebhook(mid, dataForWebhook, msgType, recipientId);

                if (onMessageSent) {
                    onMessageSent({
                        id: storedMsg?.id || Date.now(),
                        type: msgType,
                        text: input.trim() || null,
                        media_url: mediaUrl,
                        from: null,
                        to: recipientId,
                        mid,
                    });
                }
                clearFile();
            } else {
                apiResponse = await sendWhatsAppText(recipientId, input.trim());
                const mid = apiResponse.messages?.[0]?.id || `text_${Date.now()}`;

                const storedMsg = await storeMessage('text', input.trim(), null, mid, recipientId);
                await postToWebhook(mid, input.trim(), 'text', recipientId);

                if (onMessageSent) {
                    onMessageSent({
                        id: storedMsg?.id || Date.now(),
                        type: 'text',
                        text: input.trim(),
                        from: null,
                        to: recipientId,
                        mid,
                    });
                }
            }

            setInput('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';

        } catch (err: any) {
            console.error('Send error:', err);
            setError(err.message);
            setTimeout(() => setError(null), 5000);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const autoResize = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!recipientId) return null;

    return (
        <div className="border-t border-slate-200 bg-white px-2 py-2 relative flex-shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,audio/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {error && (
                <div className="absolute bottom-full left-2 right-2 sm:left-4 sm:right-4 mb-2 bg-red-600 text-white text-[11px] sm:text-xs px-4 py-2 rounded-xl z-50 shadow-lg font-bold">
                    ⚠️ {error}
                </div>
            )}

            {/* Recording UI */}
            {isRecording && (
                <div className="mb-2 p-2 sm:p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-600 font-bold text-xs sm:text-sm">{formatTime(recordingTime)}</span>
                    </div>
                    <button
                        onClick={stopRecording}
                        className="px-4 py-1.5 bg-red-500 text-white rounded-full text-xs sm:text-sm font-bold shadow-sm"
                    >
                        Send Audio
                    </button>
                </div>
            )}

            {/* Sending indicator */}
            {sending && (
                <div className="mb-2 p-2 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                    <Loader2 size={14} className="text-red-500 animate-spin" />
                    <span className="text-red-600 text-xs font-bold font-mono">ENCRYPTING...</span>
                </div>
            )}

            {/* File Preview */}
            {selectedFile && !isRecording && !sending && (
                <div className="mb-2 p-2 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
                    {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-xl border border-white shadow-sm" />
                    ) : (
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                            <Mic size={20} className="text-red-500" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-slate-900 text-xs sm:text-sm font-bold truncate">{selectedFile.name}</p>
                        <p className="text-slate-500 text-[10px] sm:text-xs">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={clearFile} className="p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>
            )}

            {!isRecording && (
                <div className="flex items-end gap-1 sm:gap-2">
                    <button className="p-2.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all hidden sm:block">
                        <Smile size={22} />
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                        <Paperclip size={20} />
                    </button>

                    <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-red-500/30 focus-within:bg-white transition-all">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => { setInput(e.target.value); autoResize(); }}
                            onKeyDown={handleKeyDown}
                            placeholder="Message..."
                            className="w-full bg-transparent text-slate-900 px-4 py-2 text-[14px] sm:text-[15px] resize-none focus:outline-none placeholder:text-slate-400 italic"
                            rows={1}
                            style={{ minHeight: '38px', maxHeight: '120px' }}
                        />
                    </div>

                    {(input.trim() || selectedFile) ? (
                        <button
                            onClick={handleSend}
                            disabled={sending}
                            className="p-2.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    ) : (
                        <button
                            onClick={startRecording}
                            disabled={sending}
                            className="p-2.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Mic size={20} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
