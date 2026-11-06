export interface ChatBookingDetails {
  id: string;
  booking_date: string;
  booking_time: string;
  class_name: string;
  verification_code: string;
}

export interface ChatConversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  booking_id?: string | null;
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
  other_participant: {
    id: string;
    username: string;
    avatar_url: string | null;
    specialty?: string[] | null;
    bio?: string | null;
    rating?: number | null;
    experience_years?: number | null;
    is_verified?: boolean | null;
  };
  booking_details?: ChatBookingDetails | null;
  unread_count: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}
