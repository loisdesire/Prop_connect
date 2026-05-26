import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ArrowLeft, User, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: number;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  receiver_name: string;
  property_id?: number;
  property_title?: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface MessagesProps {
  onBack?: () => void;
}

export default function Messages({ onBack }: MessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Map<string, Message[]>>(new Map());
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetchMessages();
  }, []);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      setMessages(data || []);
      
      // Group into conversations
      const convos = new Map<string, Message[]>();
      (data || []).forEach((msg: Message) => {
        const key = `${msg.sender_id}-${msg.receiver_id}`;
        if (!convos.has(key)) convos.set(key, []);
        convos.get(key)!.push(msg);
      });
      setConversations(convos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    
    const [senderId, receiverId] = selectedConv.split('-');
    const lastMsg = conversations.get(selectedConv)?.[0];
    
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: 'user-demo',
          sender_name: 'Demo Buyer',
          receiver_id: receiverId,
          receiver_name: lastMsg?.sender_name === 'Demo Buyer' ? lastMsg.receiver_name : lastMsg?.sender_name,
          content: newMessage,
        }),
      });
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };
  
  const selectedMessages = selectedConv ? conversations.get(selectedConv) : [];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back</span>
          </button>
        )}
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-1">Communicate securely with agents and buyers</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
          <div className="flex h-full">
            {/* Conversation List */}
            <div className={`w-80 border-r border-gray-100 flex flex-col ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search messages..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {Array.from(conversations.entries()).map(([key, msgs]) => {
                  const lastMsg = msgs[msgs.length - 1];
                  const otherName = lastMsg.sender_name === 'Demo Buyer' ? lastMsg.receiver_name : lastMsg.sender_name;
                  const isSelected = selectedConv === key;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedConv(key)}
                      className={`w-full p-4 text-left border-b border-gray-50 hover:bg-gray-50 transition ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {otherName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-gray-900 truncate">{otherName}</span>
                            <span className="text-xs text-gray-400">{new Date(lastMsg.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-500 truncate mt-0.5">{lastMsg.content}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
                
                {conversations.size === 0 && !loading && (
                  <div className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">Start a conversation from a property listing</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${selectedConv ? 'flex' : 'hidden md:flex'}`}>
              {selectedConv && selectedMessages ? (
                <>
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <button onClick={() => setSelectedConv(null)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {(selectedMessages[0]?.sender_name === 'Demo Buyer' ? selectedMessages[0]?.receiver_name : selectedMessages[0]?.sender_name)?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedMessages[0]?.sender_name === 'Demo Buyer' ? selectedMessages[0]?.receiver_name : selectedMessages[0]?.sender_name}
                      </h3>
                      {selectedMessages[0]?.property_title && (
                        <p className="text-xs text-blue-600">Re: {selectedMessages[0].property_title}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender_name === 'Demo Buyer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                          msg.sender_name === 'Demo Buyer'
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.sender_name === 'Demo Buyer' ? 'text-blue-200' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">Select a conversation</h3>
                    <p className="text-gray-500 mt-1">Choose a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}