import { useState } from 'react';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatHeader } from './components/ChatHeader';
import { NeuralFeed } from './components/NeuralFeed';
import { OutboundHub } from './components/OutboundHub';
import { useMessages } from './hooks/useMessages';
import { WhatsAppMessage } from './types';

function App() {
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const { addLocalMessage, refetch } = useMessages();

    const handleSelectChat = (contactId: string) => {
        setSelectedChat(contactId);
        setShowMobileChat(true);
    };

    const handleBack = () => {
        setShowMobileChat(false);
    };

    const handleMessageSent = (message: Partial<WhatsAppMessage>) => {
        console.log('App: Message sent callback, adding to local state:', message);
        addLocalMessage(message);
        // Also refetch to ensure sync
        setTimeout(() => refetch(), 500);
    };

    return (
        <div className="flex h-screen w-screen bg-black overflow-hidden">
            {/* Sidebar */}
            <div className={`${showMobileChat ? 'hidden md:flex' : 'flex'} h-full`}>
                <ChatSidebar
                    onSelectChat={handleSelectChat}
                    selectedChat={selectedChat}
                />
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col h-full bg-[#0a0a0a] ${!showMobileChat && !selectedChat ? 'hidden md:flex' : 'flex'}`}>
                {selectedChat ? (
                    <>
                        <ChatHeader
                            contactId={selectedChat}
                            onBack={handleBack}
                            showBackButton={showMobileChat}
                        />
                        <NeuralFeed selectedChat={selectedChat} />
                        <OutboundHub recipientId={selectedChat} onMessageSent={handleMessageSent} />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-72 h-72 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#25D366]/5 to-transparent flex items-center justify-center">
                                <svg viewBox="0 0 303 172" width="250" className="text-[#25D366]/20">
                                    <path fill="currentColor" d="M229.565 160.229c32.647-16.024 54.484-49.903 54.484-88.87C284.049 31.921 252.128 0 212.69 0c-28.076 0-52.58 16.166-64.39 39.695C136.49 16.166 111.986 0 83.91 0 44.472 0 12.551 31.921 12.551 71.36c0 38.966 21.837 72.845 54.484 88.869-14.167 6.163-26.452 15.528-35.706 27.2h233.942c-9.254-11.672-21.539-21.037-35.706-27.2z" />
                                </svg>
                            </div>
                            <h2 className="text-white text-2xl font-light mb-3">WhatsApp EBP</h2>
                            <p className="text-zinc-500 text-sm max-w-sm">
                                Send and receive messages from your WhatsApp Business account.
                                <br />
                                Select a conversation from the sidebar to start.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
