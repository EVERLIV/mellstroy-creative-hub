import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Loader2, ArrowLeft, Reply, X } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  reply_to_id?: string | null;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

interface EventGroupChatProps {
  eventId: string;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

const EventGroupChat: React.FC<EventGroupChatProps> = ({ eventId, currentUserId, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data: messagesData, error } = await supabase
        .from('event_messages')
        .select('id, content, created_at, user_id, reply_to_id')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (!error && messagesData) {
        const userIds = [...new Set(messagesData.map(m => m.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        const messagesWithProfiles: Message[] = messagesData.map(msg => ({
          ...msg,
          profiles: profilesMap.get(msg.user_id) as any
        }));
        
        setMessages(messagesWithProfiles);
      }
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`event_chat_${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'event_messages',
        filter: `event_id=eq.${eventId}`
      }, async (payload) => {
        const newMsg = payload.new as any;
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', newMsg.user_id)
          .single();

        const messageWithProfile: Message = {
          id: newMsg.id,
          content: newMsg.content,
          created_at: newMsg.created_at,
          user_id: newMsg.user_id,
          reply_to_id: newMsg.reply_to_id,
          profiles: profileData as any
        };
        
        setMessages(prev => [...prev, messageWithProfile]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const { error } = await supabase
      .from('event_messages')
      .insert({
        event_id: eventId,
        user_id: currentUserId,
        content: newMessage.trim(),
        reply_to_id: replyTo?.id || null
      });

    if (!error) {
      setNewMessage('');
      setReplyTo(null);
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
           date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getReplyMessage = (replyToId: string) => {
    return messages.find(m => m.id === replyToId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h2 className="text-base font-bold text-foreground">Group Chat</h2>
            <span className="text-xs text-muted-foreground">{messages.length} messages</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground text-sm">No messages yet</p>
              <p className="text-muted-foreground text-xs">Be the first to say hello!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.user_id === currentUserId;
              const username = (msg.profiles as any)?.username || 'Unknown';
              const avatarUrl = (msg.profiles as any)?.avatar_url;
              const repliedMsg = msg.reply_to_id ? getReplyMessage(msg.reply_to_id) : null;
              const repliedUsername = repliedMsg?.profiles?.username || 'Unknown';

              return (
                <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {!isOwn && (
                      <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">{username}</p>
                    )}
                    
                    {/* Reply preview */}
                    {repliedMsg && (
                      <div className={`mb-1 px-2 py-1 rounded-lg border-l-2 border-primary/50 bg-muted/50 ${isOwn ? 'ml-auto' : ''}`}>
                        <p className="text-[10px] text-primary font-medium">{repliedUsername}</p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{repliedMsg.content}</p>
                      </div>
                    )}
                    
                    <div 
                      className={`group relative px-3 py-2 rounded-2xl ${
                        isOwn 
                          ? 'bg-primary text-primary-foreground rounded-br-md' 
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.content}</p>
                      
                      {/* Reply button */}
                      <button
                        onClick={() => {
                          setReplyTo(msg);
                          inputRef.current?.focus();
                        }}
                        className={`absolute ${isOwn ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted`}
                      >
                        <Reply className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                    <p className={`text-[10px] text-muted-foreground mt-0.5 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply preview bar */}
        {replyTo && (
          <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center gap-2">
            <div className="w-1 h-8 bg-primary rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary font-medium">
                Replying to {replyTo.user_id === currentUserId ? 'yourself' : replyTo.profiles?.username || 'Unknown'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-border bg-card flex-shrink-0" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={replyTo ? "Reply..." : "Type a message..."}
              className="flex-1 px-4 py-2.5 bg-muted rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={500}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventGroupChat;
