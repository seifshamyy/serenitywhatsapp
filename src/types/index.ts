export interface WhatsAppMessage {
    id: number;
    type: 'text' | 'image' | 'audio' | 'video';
    from: string | null;      // If populated = incoming message from this contact
    to: string | null;        // If populated = outgoing message to this contact
    media_url: string | null;
    is_reply: string | null;
    reply_to_mid: string | null;
    text: string | null;
    mid: string | null;
    created_at: string;       // Timestamp for ordering
}

// Helper to get the contact ID from a message
export const getContactId = (msg: WhatsAppMessage): string | null => {
    // If 'from' is a phone number, that's the contact (incoming)
    // If 'to' is a phone number, that's the contact (outgoing)
    if (msg.from && /^\d+$/.test(msg.from)) return msg.from;
    if (msg.to && /^\d+$/.test(msg.to)) return msg.to;
    return null;
};

// Helper to check if message is outgoing (sent by us)
export const isOutgoing = (msg: WhatsAppMessage): boolean => {
    // If 'from' is null or not a number, we sent it
    return !msg.from || !/^\d+$/.test(msg.from);
};
