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

export interface ContactEbp {
    id: number;               // Phone number as bigint
    name_WA: string | null;
    AI_replies: string | null; // "true" or "false"
    tags: number[] | null;    // Array of tag IDs
}

export interface Tag {
    id: number;
    'tag name': string | null;
    'tag hex': string | null;
}

// 7 preset tag colors
export const TAG_COLORS = [
    { name: 'Green', hex: '#25D366' },
    { name: 'Blue', hex: '#2196F3' },
    { name: 'Purple', hex: '#9C27B0' },
    { name: 'Orange', hex: '#FF9800' },
    { name: 'Red', hex: '#F44336' },
    { name: 'Pink', hex: '#E91E63' },
    { name: 'Cyan', hex: '#00BCD4' },
];

// Helper to get the contact ID from a message
export const getContactId = (msg: WhatsAppMessage): string | null => {
    if (msg.from && /^\d+$/.test(msg.from)) return msg.from;
    if (msg.to && /^\d+$/.test(msg.to)) return msg.to;
    return null;
};

// Helper to check if message is outgoing (sent by us)
export const isOutgoing = (msg: WhatsAppMessage): boolean => {
    return !msg.from || !/^\d+$/.test(msg.from);
};
