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
      <div className="bg-white h-full flex items-center justify-center">
        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm z-20 flex-shrink-0">
        <div className="w-9"></div>
        <h1 className="text-base font-bold text-gray-900">Messages</h1>
        <div className="w-9"></div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 bg-gray-50 pb-[calc(5rem+env(safe-area-inset-bottom))]">
          {conversations.length === 0 ? (
            <div className="text-center mt-12">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-900 mt-4">No Conversations Yet</p>
              <p className="text-xs text-gray-600 mt-2">
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
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={conv.other_participant.avatar_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100'}
                        alt={conv.other_participant.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm truncate ${conv.unread_count > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>
                          {conv.other_participant.username}
                        </h3>
                        {conv.last_message && (
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      {conv.last_message && (
                        <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
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