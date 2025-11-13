import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Loader } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
  other_participant: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  unread_count: number;
}

const MessageListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Get all conversations for this user
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
          .order('last_message_at', { ascending: false });

        if (convError) throw convError;

        if (!convData || convData.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        // Get last message and other participant info for each conversation
        const conversationsWithDetails = await Promise.all(
          convData.map(async (conv) => {
            const otherParticipantId = conv.participant_1_id === user.id 
              ? conv.participant_2_id 
              : conv.participant_1_id;

            // Get other participant profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', otherParticipantId)
              .single();

            // Get last message
            const { data: lastMessageData } = await supabase
              .from('messages')
              .select('content, sender_id, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Get unread count
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .eq('recipient_id', user.id)
              .eq('is_read', false);

            return {
              ...conv,
              other_participant: profileData || { id: otherParticipantId, username: 'Unknown', avatar_url: null },
              last_message: lastMessageData || undefined,
              unread_count: unreadCount || 0
            };
          })
        );

        setConversations(conversationsWithDetails);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          // Reload conversations when new message arrives
          loadConversationsQuick();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadConversationsQuick = async () => {
    if (!user) return;

    const { data: convData } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (convData) {
      const conversationsWithDetails = await Promise.all(
        convData.map(async (conv) => {
          const otherParticipantId = conv.participant_1_id === user.id 
            ? conv.participant_2_id 
            : conv.participant_1_id;

          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', otherParticipantId)
            .single();

          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('content, sender_id, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('recipient_id', user.id)
            .eq('is_read', false);

          return {
            ...conv,
            other_participant: profileData || { id: otherParticipantId, username: 'Unknown', avatar_url: null },
            last_message: lastMessageData || undefined,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    }
  };

  if (loading) {
    return (
      <div className="bg-background h-full flex items-center justify-center">
        <Loader className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card shadow-sm z-20 flex-shrink-0 border-b border-border">
        <div className="w-9"></div>
        <h1 className="text-lg font-bold text-foreground">Messages</h1>
        <div className="w-9"></div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 bg-background pb-[calc(5rem+env(safe-area-inset-bottom))]">
          {conversations.length === 0 ? (
            <div className="text-center mt-12">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-sm font-bold text-foreground mt-4">No Conversations Yet</p>
              <p className="text-xs text-muted-foreground mt-2">
                Book a class with a trainer to start chatting.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => {
                const isMyMessage = conv.last_message?.sender_id === user?.id;
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/messages/${conv.other_participant.id}`)}
                    className="w-full flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:shadow-sm hover:-translate-y-0.5 transition-all text-left"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={conv.other_participant.avatar_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100'}
                        alt={conv.other_participant.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-border"
                      />
                      {conv.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-xs font-bold">{conv.unread_count}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-foreground truncate">
                          {conv.other_participant.username}
                        </span>
                        {conv.last_message && (
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      {conv.last_message && (
                        <p className={`text-xs truncate ${conv.unread_count > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                          {isMyMessage && 'You: '}
                          {conv.last_message.content}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageListPage;