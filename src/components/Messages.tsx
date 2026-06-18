import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ArrowLeft, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { normalizeConversationId, resolveConversationDisplayName, type ConversationRouteState } from '../lib/messageFlow';

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
  initialState?: ConversationRouteState;
  threadUserId?: string;
}

export default function Messages({ onBack, initialState, threadUserId }: MessagesProps) {
  const navigate = useNavigate();
  const location = useLocation() as { state?: ConversationRouteState };
  const routeState = initialState || location.state;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Map<string, Message[]>>(new Map());
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserName, setCurrentUserName] = useState('User');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<'buyer' | 'realtor' | null>(null);
  const [selectedProfileName, setSelectedProfileName] = useState<string | null>(null);
  const [profileNames, setProfileNames] = useState<Map<string, string>>(new Map());
  const [sendError, setSendError] = useState<string | null>(null);
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(normalizeConversationId(routeState?.openConversationWith));
  const [pendingConversationName, setPendingConversationName] = useState<string | null>(normalizeConversationId(routeState?.openConversationWithName));
  const [draftFromRoute, setDraftFromRoute] = useState<string>(normalizeConversationId(routeState?.draftMessage) || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Refs mirror state so isSelfMessage always reads latest values even during async renders
  const currentUserIdRef = useRef('');
  const currentUserRoleRef = useRef<'buyer' | 'realtor' | null>(null);

  const buildFullName = (profileData: any) => {
    if (!profileData) return null;
    const fullName = normalizeConversationId(profileData?.full_name || undefined);
    if (fullName) return fullName;

    const parts = [profileData?.first_name, profileData?.last_name].map((part) => normalizeConversationId(part || undefined)).filter(Boolean);
    if (parts.length > 0) return parts.join(' ');

    const email = profileData?.email || '';
    if (email) {
      const localPart = normalizeConversationId(email.split('@')?.[0] || undefined);
      if (localPart) return localPart;
    }
    return null;
  };

  const buildFallbackDisplayName = (role: 'buyer' | 'realtor' | null, email?: string | null) => {
    if (email && email.length > 0) {
      const localPart = normalizeConversationId(email.split('@')?.[0] || undefined);
      if (localPart) return localPart;
    }
    return role === 'realtor' ? 'Realtor' : 'Buyer';
  };

  const getProfileName = (id: string | null, fallback?: string): string => {
    if (!id) return fallback || 'Unknown';
    return profileNames.get(id) || fallback || 'Unknown';
  };

  const fetchProfilesForIds = async (ids: string[]) => {
    if (ids.length === 0) return;
    
    // Extract actual IDs (strip "agent-" prefix) and filter out cached ones
    const uniqueIds = Array.from(new Set(
      ids
        .map(id => (id?.startsWith('agent-') ? id.substring(6) : id)) // Strip "agent-" prefix
        .filter(id => id && !profileNames.has(id)) // Only fetch if not cached
    ));
    
    if (uniqueIds.length === 0) return;

    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', uniqueIds);

      if (profiles) {
        const newNames = new Map(profileNames);
        profiles.forEach(p => {
          const name = buildFullName(p);
          if (name) {
            // Store under both plain ID and agent-prefixed ID for lookup
            newNames.set(p.id, name);
            newNames.set(`agent-${p.id}`, name);
          }
        });
        setProfileNames(newNames);
      }
    } catch (err) {
      console.warn('Failed to fetch profiles:', err);
    }
  };

  const getRealtorThreadSenderId = () => (threadUserId ? `agent-${threadUserId}` : null);

  const getFetchUserIds = (userId: string, role: 'buyer' | 'realtor' | null) => {
    const ids = new Set<string>();
    if (userId) ids.add(userId);
    if (role === 'realtor' && threadUserId) {
      ids.add(threadUserId);
      ids.add(`agent-${threadUserId}`);
    }
    return Array.from(ids);
  };

  useEffect(() => {
    const loadCurrentUser = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.user?.id) return { userId: '', role: null as 'buyer' | 'realtor' | null };

      setCurrentUserId(session.user.id);
      currentUserIdRef.current = session.user.id;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      const role = (profileData?.role as 'buyer' | 'realtor' | null) || (threadUserId ? 'realtor' : null);
      let resolvedName = buildFullName(profileData);

      if (!resolvedName && role === 'realtor') {
        try {
          const response = await fetch(`/api/agents?id=${encodeURIComponent(session.user.id)}`);
          if (response.ok) {
            const agentData = await response.json().catch(() => null);
            if (agentData) {
              resolvedName = buildFullName(agentData) || null;
            }
          }
        } catch (e) {
          console.warn('Failed to fetch agent data:', e);
        }
      }

      if (resolvedName) setCurrentUserName(resolvedName);
      else setCurrentUserName(buildFallbackDisplayName(role, session.user.email));

      setCurrentUserRole(role);
      currentUserRoleRef.current = role;

      // Add current user to profile names map
      const newNames = new Map(profileNames);
      if (resolvedName) newNames.set(session.user.id, resolvedName);
      setProfileNames(newNames);
      
      return { userId: session.user.id, role };
    };

    const initMessages = async () => {
      const { userId, role } = await loadCurrentUser();
      if (userId) {
        await fetchMessages(userId, role);
      } else {
        setLoading(false);
      }
    };

    void initMessages();
  }, []);

  useEffect(() => {
    if (!routeState?.openConversationWith) return;
    setPendingConversationId(normalizeConversationId(routeState.openConversationWith));
    setPendingConversationName(normalizeConversationId(routeState.openConversationWithName));
    setDraftFromRoute(normalizeConversationId(routeState.draftMessage) || '');
  }, [routeState?.openConversationWith, routeState?.openConversationWithName, routeState?.draftMessage]);

  useEffect(() => {
    if (!pendingConversationId) return;
    setSelectedConv(current => current || pendingConversationId);
  }, [pendingConversationId]);

  useEffect(() => {
    if (!pendingConversationId) return;
    setSelectedConv(current => {
      if (current === pendingConversationId) return current;
      if (conversations.size === 0) return pendingConversationId;
      if (conversations.has(pendingConversationId)) return pendingConversationId;
      return current;
    });
  }, [conversations, pendingConversationId]);

  useEffect(() => {
    if (newMessage.trim()) return;
    if (draftFromRoute) {
      setNewMessage(draftFromRoute);
      return;
    }
    if (pendingConversationId && currentUserRole === 'realtor') {
      setNewMessage('Hi, thanks for reaching out. I’d be happy to help with this property. What would you like to know?');
    }
  }, [draftFromRoute, pendingConversationId, currentUserRole, newMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async (userId: string = threadUserId || currentUserId, role: 'buyer' | 'realtor' | null = currentUserRole) => {
    const fetchIds = getFetchUserIds(userId, role);
    if (fetchIds.length === 0) return;

    try {
      const responses = await Promise.all(
        fetchIds.map(async (id) => {
          const res = await fetch(`/api/messages?user_id=${encodeURIComponent(id)}`);
          if (!res.ok) throw new Error('Failed to fetch messages');
          return res.json();
        }),
      );

      const merged = new Map<number, Message>();
      responses.flat().forEach((message: Message) => {
        merged.set(message.id, message);
      });
      const data = Array.from(merged.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      setMessages(data);

      const convos = new Map<string, Message[]>();
      const realtorSenderId = role === 'realtor' ? getRealtorThreadSenderId() : null;
      const idsToFetch: string[] = [];
      
      data.forEach((msg: Message) => {
        const otherPartyId = role === 'realtor' && realtorSenderId
          ? (msg.sender_id === realtorSenderId || msg.sender_id === userId ? msg.receiver_id : msg.sender_id)
          : (msg.sender_id === userId ? msg.receiver_id : msg.sender_id);
        
        if (!convos.has(otherPartyId)) convos.set(otherPartyId, []);
        convos.get(otherPartyId)!.push(msg);
        
        // Collect IDs to fetch profiles for
        if (otherPartyId) idsToFetch.push(otherPartyId);
        if (msg.sender_id && !msg.sender_id.startsWith('agent-')) idsToFetch.push(msg.sender_id);
        if (msg.receiver_id && !msg.receiver_id.startsWith('agent-')) idsToFetch.push(msg.receiver_id);
      });

      convos.forEach(msgs => msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
      setConversations(convos);
      
      // Fetch profiles for all participants
      await fetchProfilesForIds(idsToFetch);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const conversationId = selectedConv || pendingConversationId;
    if (!newMessage.trim() || !conversationId) return;
    setSendError(null);

    const selectedMessages = conversations.get(conversationId) || [];
    const lastMsg = selectedMessages[selectedMessages.length - 1];
    
    // Determine receiver ID based on message direction
    const receiverId = lastMsg
      ? (lastMsg.sender_id === currentUserId ? lastMsg.receiver_id : lastMsg.sender_id)
      : conversationId;
    
    // Use profile name for receiver, fallback to pending conversation name
    const receiverName = getProfileName(receiverId, pendingConversationName || 'Agent');
    
    const senderId = currentUserRole === 'realtor' && threadUserId ? `agent-${threadUserId}` : currentUserId;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: senderId,
          sender_name: currentUserName,
          receiver_id: receiverId,
          receiver_name: receiverName,
          property_id: lastMsg?.property_id,
          property_title: lastMsg?.property_title || routeState?.propertyTitle || null,
          content: newMessage,
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      setNewMessage('');
      setDraftFromRoute('');
      await fetchMessages();
    } catch (err: any) {
      setSendError(err?.message || 'Failed to send message. Please try again.');
    }
  };

  const selectedMessages = selectedConv ? (conversations.get(selectedConv) || []) : [];
  const selectedOtherPartyId = selectedConv || pendingConversationId || null;
  
  // Get other party name: from profile cache, then message sender_name (if not generic), then pending name, then default
  const selectedConversationName = (() => {
    const cachedName = profileNames.get(selectedOtherPartyId || '');
    if (cachedName) return cachedName;
    
    // Check last message for sender/receiver name if it's not a generic role label
    const lastMsg = selectedMessages[selectedMessages.length - 1];
    if (lastMsg) {
      const msgSenderName = lastMsg.sender_id === (selectedOtherPartyId) ? lastMsg.sender_name : lastMsg.receiver_name;
      if (msgSenderName && msgSenderName !== 'Buyer' && msgSenderName !== 'Realtor' && msgSenderName.length > 0) {
        return msgSenderName;
      }
    }
    
    return pendingConversationName || 'Agent';
  })();
  
  const canViewProfile = Boolean(selectedOtherPartyId);
  const canCompose = Boolean(selectedConv || pendingConversationId);

  const isSelfMessage = (msg: Message) => {
    const userId = currentUserIdRef.current || currentUserId;
    const role = currentUserRoleRef.current ?? currentUserRole;
    if (role === 'realtor' && threadUserId) {
      return msg.sender_id === `agent-${threadUserId}` || msg.sender_id === userId;
    }
    return msg.sender_id === userId;
  };

  useEffect(() => {
    // Ensure selected party profile is loaded
    if (selectedOtherPartyId && !profileNames.has(selectedOtherPartyId)) {
      void fetchProfilesForIds([selectedOtherPartyId]);
    }
  }, [selectedOtherPartyId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back</span>
          </button>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
          <div className="flex h-full">
            <div className={`w-80 border-r border-gray-100 flex flex-col ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search messages..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {Array.from(conversations.entries()).map(([otherPartyId, msgs]) => {
                  const lastMsg = msgs[msgs.length - 1];
                  
                  // Get other party name: from profile cache, then message sender_name (if not generic), then pending name, then default
                  let otherName = profileNames.get(otherPartyId);
                  if (!otherName) {
                    const msgSenderName = lastMsg.sender_id === otherPartyId ? lastMsg.sender_name : lastMsg.receiver_name;
                    if (msgSenderName && msgSenderName !== 'Buyer' && msgSenderName !== 'Realtor' && msgSenderName.length > 0) {
                      otherName = msgSenderName;
                    }
                  }
                  otherName = otherName || pendingConversationName || 'Agent';
                  
                  const isSelected = selectedConv === otherPartyId;

                  return (
                    <button
                      key={otherPartyId}
                      onClick={() => setSelectedConv(otherPartyId)}
                      className={`w-full p-4 text-left border-b border-gray-50 hover:bg-gray-50 transition ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {(otherName || 'A').charAt(0)}
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

            <div className={`flex-1 flex flex-col ${selectedConv || pendingConversationId ? 'flex' : 'hidden md:flex'}`}>
              {canCompose ? (
                <>
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <button onClick={() => setSelectedConv(null)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {(selectedConversationName || 'A').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (!canViewProfile || !selectedOtherPartyId) return;
                          const displayName = resolveConversationDisplayName(currentUserId, selectedMessages[0], pendingConversationName);
                          navigate(`/agents/${selectedOtherPartyId}`, { state: { agent: { id: selectedOtherPartyId, name: displayName } } });
                        }}
                        className={`text-left ${canViewProfile ? 'cursor-pointer hover:text-blue-600' : 'cursor-default'}`}
                      >
                        <h3 className="font-semibold text-gray-900 truncate">{selectedConversationName}</h3>
                      </button>
                      {selectedMessages[0]?.property_title && <p className="text-xs text-blue-600">Re: {selectedMessages[0].property_title}</p>}
                    </div>
                    {canViewProfile && (
                      <button
                        onClick={() => {
                          if (!selectedOtherPartyId) return;
                          const displayName = resolveConversationDisplayName(currentUserId, selectedMessages[0], pendingConversationName);
                          navigate(`/agents/${selectedOtherPartyId}`, { state: { agent: { id: selectedOtherPartyId, name: displayName } } });
                        }}
                        className="hidden sm:inline-flex px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
                      >
                        View profile
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isSelfMessage(msg) ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${isSelfMessage(msg) ? 'bg-blue-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'}`}>
                          <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${isSelfMessage(msg) ? 'text-blue-100' : 'text-gray-500'}`}>
                            {isSelfMessage(msg) ? currentUserName : selectedConversationName}
                          </p>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isSelfMessage(msg) ? 'text-blue-200' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-gray-100">
                    {sendError && (
                      <p className="text-xs text-red-600 mb-2 px-1">{sendError}</p>
                    )}
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => { setNewMessage(e.target.value); if (sendError) setSendError(null); }}
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
                <>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900">Select a conversation</h3>
                      <p className="text-gray-500 mt-1">Choose a conversation to start messaging</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}