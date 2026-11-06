import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Send,
  MoreVertical,
  Flag,
  AlertTriangle,
  Calendar,
  Clock,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react';
import { AppScreen } from '../src/components/layout/screen';
import { EmptyState } from '../src/components/layout/states';
import { APP_CONTENT } from '../src/components/layout/shell';
import MessageBubble from '../components/chat/MessageBubble';
import { Alert, AlertDescription, AlertTitle } from '../src/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '../src/components/ui/avatar';
import { Badge } from '../src/components/ui/badge';
import { Button } from '../src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../src/components/ui/dropdown-menu';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '../src/components/ui/input-group';
import { ScrollArea } from '../src/components/ui/scroll-area';
import { Separator } from '../src/components/ui/separator';
import { Skeleton } from '../src/components/ui/skeleton';
import { Spinner } from '../src/components/ui/spinner';
import { cn } from '../src/lib/utils';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../src/hooks/useAuth';
import { useToast } from '../src/hooks/use-toast';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import ReportModal from '../components/ReportModal';
import MessageBubbleSkeleton from '../components/MessageBubbleSkeleton';

function formatDayLabel(date: Date) {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
}

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Participant {
  id: string;
  username: string;
  avatar_url: string | null;
}

const ChatConversationPage: React.FC = () => {
  const { recipientId } = useParams<{ recipientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [conversationBookingDetails, setConversationBookingDetails] = useState<any>(null);
  const [liveConnected, setLiveConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get booking details from location state or conversation
  const bookingDetails = location.state?.bookingDetails || conversationBookingDetails;

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load recipient profile
  useEffect(() => {
    const loadRecipient = async () => {
      if (!recipientId) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', recipientId)
          .single();

        if (error) throw error;
        setRecipient(data);
      } catch (error) {
        console.error('Error loading recipient:', error);
        toast({
          title: 'Error',
          description: 'Failed to load recipient information',
          variant: 'destructive'
        });
      }
    };

    loadRecipient();
  }, [recipientId, toast]);

  // Load or create conversation
  useEffect(() => {
    const loadConversation = async () => {
      if (!user || !recipientId) return;

      try {
        setLoading(true);
        
        // Try to find existing conversation
        const { data: existingConversation, error: fetchError } = await supabase
          .from('conversations')
          .select('*')
          .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${recipientId}),and(participant_1_id.eq.${recipientId},participant_2_id.eq.${user.id})`)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        if (existingConversation) {
          setConversationId(existingConversation.id);
          setIsNewConversation(false);
          
          // Load booking details if conversation has booking_id
          if (existingConversation.booking_id) {
            try {
              const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .select('id, booking_date, booking_time, verification_code, class_id')
                .eq('id', existingConversation.booking_id)
                .single();

              if (bookingData && !bookingError) {
                const { data: classData } = await supabase
                  .from('classes')
                  .select('name')
                  .eq('id', bookingData.class_id)
                  .single();

                setConversationBookingDetails({
                  id: bookingData.id,
                  booking_date: bookingData.booking_date,
                  booking_time: bookingData.booking_time,
                  class_name: classData?.name || 'Unknown Class',
                  verification_code: bookingData.verification_code || ''
                });
              }
            } catch (err) {
              console.error('Error loading booking details:', err);
            }
          }
        } else {
          // Create new conversation
          const { data: newConversation, error: createError } = await supabase
            .from('conversations')
            .insert({
              participant_1_id: user.id,
              participant_2_id: recipientId
            })
            .select()
            .single();

          if (createError) throw createError;
          setConversationId(newConversation.id);
          setIsNewConversation(true);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        toast({
          title: 'Error',
          description: 'Failed to load conversation',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [user, recipientId, toast]);

  // Load messages and send safety warning for new conversations
  useEffect(() => {
    if (!conversationId) return;

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);

        // Send safety warning message if this is a new conversation
        if (isNewConversation && user && recipientId && (!data || data.length === 0)) {
          const safetyMessage = `⚠️ Safety Reminder:\n\n• Never transfer money in advance\n• Do not pay deposits before meeting\n• Report any suspicious behavior or fraud attempts\n• Use the platform's secure payment system\n\nStay safe! If you have concerns about fraud, please report it immediately.`;
          
          // Send as system message (use a special marker in content)
          const { error: messageError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              sender_id: user.id, // Will be marked as system message by content check
              recipient_id: recipientId,
              content: safetyMessage
            });

          if (!messageError) {
            // Reload messages to show the safety warning
            const { data: updatedMessages } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conversationId)
              .order('created_at', { ascending: true });
            
            setMessages(updatedMessages || []);
          }
        }

        // Mark messages as read
        if (user) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .eq('recipient_id', user.id)
            .eq('is_read', false);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [conversationId, user, isNewConversation, recipientId]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversationId) return;

    setLiveConnected(false);
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          );

          if (user && incoming.recipient_id === user.id) {
            supabase.from('messages').update({ is_read: true }).eq('id', incoming.id);
          }
        }
      )
      .subscribe((status) => {
        setLiveConnected(status === 'SUBSCRIBED');
      });

    return () => {
      setLiveConnected(false);
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !conversationId || !recipientId) return;

    try {
      setSending(true);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: recipientId,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendBookingDetails = async () => {
    if (!bookingDetails || !user || !conversationId || !recipientId) return;

    try {
      setSending(true);
      
      const bookingMessage = `📅 Booking Details:\n\nClass: ${bookingDetails.class_name}\nDate: ${new Date(bookingDetails.booking_date).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      })}\nTime: ${bookingDetails.booking_time}\nVerification Code: ${bookingDetails.verification_code}`;
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: recipientId,
          content: bookingMessage
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Booking details sent',
      });
    } catch (error) {
      console.error('Error sending booking details:', error);
      toast({
        title: 'Error',
        description: 'Failed to send booking details',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleReport = (_reason: string, _details: string) => {
    toast({
      title: 'Report Submitted',
      description: 'Thank you for helping keep our community safe. We will review your report.'
    });
    setShowReportModal(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const messageDays = useMemo(() => {
    const groups: Array<{ label: string; items: Message[] }> = [];
    for (const message of messages) {
      const created = new Date(message.created_at);
      const last = groups[groups.length - 1];
      if (last && isSameDay(new Date(last.items[0].created_at), created)) {
        last.items.push(message);
      } else {
        groups.push({ label: formatDayLabel(created), items: [message] });
      }
    }
    return groups;
  }, [messages]);

  return (
    <AppScreen className="flex h-[100dvh] min-w-0 flex-col overflow-hidden bg-[#f9fafb] dark:bg-background">
      <header className="shrink-0 border-b border-border bg-card/95 backdrop-blur">
        <div className={cn(APP_CONTENT, 'py-3')}>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/messages')}
              aria-label="Back to messages"
            >
              <ArrowLeft />
            </Button>

            {recipient ? (
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar className="size-10 shrink-0">
                  <AvatarImage
                    src={recipient.avatar_url || FALLBACK_AVATAR}
                    alt={recipient.username}
                    className="object-cover"
                  />
                  <AvatarFallback>{recipient.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h1 className="truncate text-base font-semibold text-foreground">
                    {recipient.username}
                  </h1>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        liveConnected ? 'bg-primary' : 'bg-muted-foreground/40'
                      )}
                      aria-hidden
                    />
                    {liveConnected ? 'Live · realtime' : 'Connecting…'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            )}

            {recipient ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Conversation options">
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setShowReportModal(true)}
                    >
                      <Flag data-icon="inline-start" />
                      Report chat
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>

        {bookingDetails ? (
          <>
            <Separator />
            <div className={cn(APP_CONTENT, 'bg-muted/40 py-2.5')}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {bookingDetails.class_name}
                    </p>
                    <Badge variant="secondary">Booking</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar aria-hidden />
                      {new Date(bookingDetails.booking_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock aria-hidden />
                      {bookingDetails.booking_time}
                    </span>
                    <span>ID: {bookingDetails.verification_code}</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={sending}
                  onClick={handleSendBookingDetails}
                >
                  <Send data-icon="inline-start" />
                  Share details
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className={cn(APP_CONTENT, 'py-4 pb-6')}>
          {loading ? (
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-3" aria-busy="true">
              <MessageBubbleSkeleton isOwn={false} />
              <MessageBubbleSkeleton isOwn />
              <MessageBubbleSkeleton isOwn={false} />
              <MessageBubbleSkeleton isOwn />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="No messages yet"
              description="Say hello to start the conversation."
              className="mt-8"
            />
          ) : (
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
              {messageDays.map((day) => (
                <div key={day.label + day.items[0].id} className="flex flex-col gap-3">
                  <div className="flex items-center justify-center">
                    <Badge variant="secondary">{day.label}</Badge>
                  </div>
                  {day.items.map((message) => {
                    const isMyMessage = message.sender_id === user?.id;
                    const isSafetyMessage = message.content.includes('⚠️ Safety Reminder');

                    if (isSafetyMessage) {
                      return (
                        <Alert key={message.id} className="mx-auto max-w-md">
                          <AlertTriangle />
                          <AlertTitle>Safety Reminder</AlertTitle>
                          <AlertDescription>
                            Never transfer money in advance. Use RhinoFit’s secure booking payment
                            and report anything suspicious.
                          </AlertDescription>
                        </Alert>
                      );
                    }

                    return (
                      <MessageBubble
                        key={message.id}
                        isOwn={isMyMessage}
                        body={
                          <span className="whitespace-pre-wrap break-words">{message.content}</span>
                        }
                        timestamp={format(new Date(message.created_at), 'h:mm a')}
                        status={
                          isMyMessage
                            ? message.is_read
                              ? 'Read'
                              : 'Sent'
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-border bg-card/95 pb-[calc(4.75rem_+_env(safe-area-inset-bottom))] backdrop-blur md:pb-0">
        <div className={cn(APP_CONTENT, 'py-3')}>
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
            <InputGroup className="bg-background">
              <InputGroupTextarea
                ref={inputRef}
                value={newMessage}
                onChange={handleInput}
                onKeyDown={handleKeyPress}
                placeholder={
                  recipient?.username ? `Message ${recipient.username}…` : 'Type a message…'
                }
                aria-label="Message"
                rows={1}
                disabled={sending}
                className="max-h-[120px] min-h-10"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  variant="default"
                  size="icon-sm"
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                  aria-label="Send message"
                >
                  {sending ? <Spinner /> : <Send />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <p className="px-1 text-[11px] text-muted-foreground">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
        trainerName={recipient?.username || 'User'}
      />
    </AppScreen>
  );
};

export default ChatConversationPage;