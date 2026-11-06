import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  Flag,
  MessageCircle,
  MoreVertical,
  Send,
} from 'lucide-react';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/src/components/ui/input-group';
import { Separator } from '@/src/components/ui/separator';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Spinner } from '@/src/components/ui/spinner';
import { EmptyState } from '@/src/components/layout/states';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/integrations/supabase/client';
import { useAuth } from '@/src/hooks/useAuth';
import { useToast } from '@/src/hooks/use-toast';
import ReportModal from '@/components/ReportModal';
import MessageBubbleSkeleton from '@/components/MessageBubbleSkeleton';
import MessageBubble from './MessageBubble';
import type { ChatBookingDetails, ChatMessage } from './types';

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100';

const QUICK_ACTIONS = [
  '⏱️ 5-min Warmup Routine',
  '📋 Intake Questionnaire',
  '📍 Locker & Entry Access',
  '🔄 Request Reschedule',
] as const;

function formatDayLabel(date: Date) {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
}

export interface ChatThreadPanelProps {
  recipientId: string;
  bookingDetailsFromNav?: ChatBookingDetails | null;
  onBack?: () => void;
  onBookingLoaded?: (booking: ChatBookingDetails | null) => void;
  onPeerLoaded?: (peer: {
    id: string;
    username: string;
    avatar_url: string | null;
    specialty?: string[] | null;
    bio?: string | null;
    rating?: number | null;
    experience_years?: number | null;
    is_verified?: boolean | null;
  }) => void;
}

export function ChatThreadPanel({
  recipientId,
  bookingDetailsFromNav,
  onBack,
  onBookingLoaded,
  onPeerLoaded,
}: ChatThreadPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<{
    id: string;
    username: string;
    avatar_url: string | null;
    specialty?: string[] | null;
    bio?: string | null;
    rating?: number | null;
    experience_years?: number | null;
    is_verified?: boolean | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [conversationBookingDetails, setConversationBookingDetails] =
    useState<ChatBookingDetails | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);

  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const bookingDetails = bookingDetailsFromNav || conversationBookingDetails;

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const loadRecipient = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(
            'id, username, avatar_url, specialty, bio, rating, experience_years, is_verified'
          )
          .eq('id', recipientId)
          .single();
        if (error) throw error;
        setRecipient(data);
        onPeerLoaded?.(data);
      } catch (error) {
        console.error('Error loading recipient:', error);
        toast({
          title: 'Error',
          description: 'Failed to load recipient information',
          variant: 'destructive',
        });
      }
    };
    loadRecipient();
  }, [recipientId, toast, onPeerLoaded]);

  useEffect(() => {
    const loadConversation = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const { data: existingConversation, error: fetchError } = await supabase
          .from('conversations')
          .select('*')
          .or(
            `and(participant_1_id.eq.${user.id},participant_2_id.eq.${recipientId}),and(participant_1_id.eq.${recipientId},participant_2_id.eq.${user.id})`
          )
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        if (existingConversation) {
          setConversationId(existingConversation.id);
          setIsNewConversation(false);

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

                const details: ChatBookingDetails = {
                  id: bookingData.id,
                  booking_date: bookingData.booking_date,
                  booking_time: bookingData.booking_time,
                  class_name: classData?.name || 'Unknown Class',
                  verification_code: bookingData.verification_code || '',
                };
                setConversationBookingDetails(details);
                onBookingLoaded?.(details);
              }
            } catch (err) {
              console.error('Error loading booking details:', err);
            }
          } else {
            setConversationBookingDetails(null);
            onBookingLoaded?.(bookingDetailsFromNav ?? null);
          }
        } else {
          const { data: newConversation, error: createError } = await supabase
            .from('conversations')
            .insert({
              participant_1_id: user.id,
              participant_2_id: recipientId,
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
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [user, recipientId, toast, onBookingLoaded, bookingDetailsFromNav]);

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

        if (isNewConversation && user && (!data || data.length === 0)) {
          const safetyMessage = `⚠️ Safety Reminder:\n\n• Never transfer money in advance\n• Do not pay deposits before meeting\n• Report any suspicious behavior or fraud attempts\n• Use the platform's secure payment system\n\nStay safe! If you have concerns about fraud, please report it immediately.`;
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: user.id,
            recipient_id: recipientId,
            content: safetyMessage,
          });
          const { data: updatedMessages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
          setMessages(updatedMessages || []);
        }

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
          const incoming = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          );
          if (user && incoming.recipient_id === user.id) {
            supabase.from('messages').update({ is_read: true }).eq('id', incoming.id);
          }
        }
      )
      .subscribe((status) => setLiveConnected(status === 'SUBSCRIBED'));

    return () => {
      setLiveConnected(false);
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const handleSend = async (text?: string) => {
    const content = (text ?? newMessage).trim();
    if (!content || !user || !conversationId) return;
    try {
      setSending(true);
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: recipientId,
        content,
      });
      if (error) throw error;
      if (!text) setNewMessage('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendBookingDetails = async () => {
    if (!bookingDetails || !user || !conversationId) return;
    const bookingMessage = `📅 Booking Details:\n\nClass: ${bookingDetails.class_name}\nDate: ${new Date(
      bookingDetails.booking_date
    ).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}\nTime: ${bookingDetails.booking_time}\nVerification Code: ${bookingDetails.verification_code}`;
    await handleSend(bookingMessage);
    toast({ title: 'Success', description: 'Booking details sent' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    const groups: Array<{ label: string; items: ChatMessage[] }> = [];
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

  const isBookingCard = (content: string) => content.startsWith('📅 Booking Details:');

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-muted/30">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          {onBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onBack}
              aria-label="Back to messages"
            >
              <ArrowLeft />
            </Button>
          ) : null}

          {recipient ? (
            <>
              <Avatar className="size-10 shrink-0">
                <AvatarImage
                  src={recipient.avatar_url || FALLBACK_AVATAR}
                  alt={recipient.username}
                  className="object-cover"
                />
                <AvatarFallback>{recipient.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-sm font-bold text-foreground">
                    {recipient.username}
                  </h2>
                  <Badge variant="secondary" className="gap-1.5">
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        liveConnected ? 'bg-primary' : 'bg-muted-foreground/50'
                      )}
                    />
                    {liveConnected ? 'Live · realtime' : 'Connecting…'}
                  </Badge>
                </div>
                <p className="truncate text-[11px] text-muted-foreground">
                  {recipient.specialty?.[0]
                    ? `${recipient.specialty[0]} coach`
                    : 'Direct message'}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          )}
        </div>

        {recipient ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Conversation options">
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

      {bookingDetails ? (
        <>
          <Separator />
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">
                  {bookingDetails.class_name}
                </span>
                <Badge variant="secondary">Booking</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar aria-hidden />
                  {new Date(bookingDetails.booking_date).toLocaleDateString('en-US', {
                    weekday: 'short',
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
        </>
      ) : null}

      <div
        ref={messagesViewportRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
      >
        <div className="flex flex-col gap-6 p-4 pb-6 lg:p-6">
          {loading ? (
            <div className="flex flex-col gap-3" aria-busy="true">
              <MessageBubbleSkeleton isOwn={false} />
              <MessageBubbleSkeleton isOwn />
              <MessageBubbleSkeleton isOwn={false} />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="No messages yet"
              description="Say hello to start the conversation."
            />
          ) : (
            messageDays.map((day) => (
              <div key={day.label + day.items[0].id} className="flex flex-col gap-4">
                <div className="flex items-center justify-center">
                  <Badge variant="secondary">{day.label}</Badge>
                </div>
                {day.items.map((message) => {
                  const isMyMessage = message.sender_id === user?.id;
                  const isSafety = message.content.includes('⚠️ Safety Reminder');

                  if (isSafety) {
                    return (
                      <Alert key={message.id} className="mx-auto max-w-md">
                        <AlertTriangle />
                        <AlertTitle>Safety Reminder</AlertTitle>
                        <AlertDescription>
                          Never transfer money in advance. Use RhinoFit’s secure booking payment and
                          report anything suspicious.
                        </AlertDescription>
                      </Alert>
                    );
                  }

                  if (isBookingCard(message.content) && isMyMessage) {
                    const lines = message.content.split('\n').filter(Boolean);
                    const classLine = lines.find((l) => l.startsWith('Class:'))?.replace('Class: ', '');
                    const dateLine = lines.find((l) => l.startsWith('Date:'))?.replace('Date: ', '');
                    const timeLine = lines.find((l) => l.startsWith('Time:'))?.replace('Time: ', '');
                    const codeLine = lines
                      .find((l) => l.startsWith('Verification Code:'))
                      ?.replace('Verification Code: ', '');

                    return (
                      <div key={message.id} className="flex flex-col items-end gap-1">
                        <div className="w-full max-w-sm rounded-2xl rounded-br-md border border-primary/20 bg-primary p-4 text-primary-foreground shadow-sm">
                          <div className="mb-3 flex items-center justify-between border-b border-primary-foreground/20 pb-3">
                            <span className="text-sm font-bold">Booking details</span>
                            <Badge className="bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20">
                              Confirmed
                            </Badge>
                          </div>
                          <dl className="flex flex-col gap-2 text-xs">
                            <div className="flex justify-between gap-3 border-b border-primary-foreground/10 pb-1">
                              <dt className="text-primary-foreground/70">Class</dt>
                              <dd className="font-bold">{classLine}</dd>
                            </div>
                            <div className="flex justify-between gap-3 border-b border-primary-foreground/10 pb-1">
                              <dt className="text-primary-foreground/70">Date</dt>
                              <dd className="font-semibold">{dateLine}</dd>
                            </div>
                            <div className="flex justify-between gap-3 border-b border-primary-foreground/10 pb-1">
                              <dt className="text-primary-foreground/70">Time</dt>
                              <dd className="font-semibold">{timeLine}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                              <dt className="text-primary-foreground/70">Code</dt>
                              <dd className="rounded bg-primary-foreground/10 px-1.5 py-0.5 font-mono font-bold">
                                {codeLine}
                              </dd>
                            </div>
                          </dl>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Sent {format(new Date(message.created_at), 'h:mm a')}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3',
                        isMyMessage ? 'justify-end' : 'items-start'
                      )}
                    >
                      {!isMyMessage ? (
                        <Avatar className="mt-1 size-8 shrink-0">
                          <AvatarImage
                            src={recipient?.avatar_url || FALLBACK_AVATAR}
                            alt={recipient?.username || 'Peer'}
                            className="object-cover"
                          />
                          <AvatarFallback>
                            {(recipient?.username || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : null}
                      <MessageBubble
                        isOwn={isMyMessage}
                        body={
                          <span className="whitespace-pre-wrap break-words">{message.content}</span>
                        }
                        timestamp={format(new Date(message.created_at), 'h:mm a')}
                        status={
                          isMyMessage ? (message.is_read ? 'Read' : 'Sent') : undefined
                        }
                      />
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="no-scrollbar relative z-10 flex shrink-0 items-center gap-2 overflow-x-auto overscroll-x-contain border-t border-border bg-background px-4 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Quick actions
        </span>
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action}
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full"
            disabled={sending || !conversationId}
            onClick={() => handleSend(action)}
          >
            {action}
          </Button>
        ))}
      </div>

      <div className="relative z-10 shrink-0 border-t border-border bg-background p-3 lg:p-4">
        <div className="flex flex-col gap-2">
          <InputGroup className="rounded-2xl bg-muted">
            <InputGroupTextarea
              ref={inputRef}
              value={newMessage}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={
                recipient?.username
                  ? `Message ${recipient.username}…`
                  : 'Type a message…'
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
                onClick={() => handleSend()}
                disabled={!newMessage.trim() || sending}
                aria-label="Send message"
              >
                {sending ? <Spinner /> : <Send />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
            <span>End-to-end encrypted athletic log</span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={(_reason, _details) => {
          toast({
            title: 'Report Submitted',
            description: 'Thank you for helping keep our community safe.',
          });
          setShowReportModal(false);
        }}
        trainerName={recipient?.username || 'User'}
      />
    </div>
  );
}

export default ChatThreadPanel;
