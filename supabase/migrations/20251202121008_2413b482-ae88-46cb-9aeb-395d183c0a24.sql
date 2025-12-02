-- Create event waitlist table
CREATE TABLE IF NOT EXISTS public.event_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notified_at TIMESTAMPTZ,
    UNIQUE(event_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_event_waitlist_event_id ON public.event_waitlist(event_id);
CREATE INDEX idx_event_waitlist_user_id ON public.event_waitlist(user_id);
CREATE INDEX idx_event_waitlist_position ON public.event_waitlist(event_id, position);

-- Enable RLS
ALTER TABLE public.event_waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_waitlist
CREATE POLICY "Anyone can view event waitlist"
    ON public.event_waitlist
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can join waitlist"
    ON public.event_waitlist
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave waitlist"
    ON public.event_waitlist
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to handle event registration
CREATE OR REPLACE FUNCTION public.register_for_event(
    _event_id UUID,
    _user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _event RECORD;
    _current_participants INTEGER;
    _is_already_registered BOOLEAN;
    _is_on_waitlist BOOLEAN;
    _waitlist_position INTEGER;
BEGIN
    -- Get event details
    SELECT * INTO _event
    FROM events
    WHERE id = _event_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Event not found',
            'status', 'error'
        );
    END IF;

    -- Check if registration is still open (6 hours before event)
    IF NOT is_event_registration_open(_event_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Registration closed (opens up to 6 hours before event)',
            'status', 'closed'
        );
    END IF;

    -- Check if already registered
    SELECT EXISTS(
        SELECT 1 FROM event_participants 
        WHERE event_id = _event_id AND user_id = _user_id
    ) INTO _is_already_registered;

    IF _is_already_registered THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Already registered for this event',
            'status', 'already_registered'
        );
    END IF;

    -- Check if already on waitlist
    SELECT EXISTS(
        SELECT 1 FROM event_waitlist 
        WHERE event_id = _event_id AND user_id = _user_id
    ) INTO _is_on_waitlist;

    IF _is_on_waitlist THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Already on waitlist for this event',
            'status', 'already_waitlisted'
        );
    END IF;

    -- Get current participant count
    SELECT COUNT(*) INTO _current_participants
    FROM event_participants
    WHERE event_id = _event_id;

    -- Check if event has capacity limit and if it's full
    IF _event.max_participants IS NOT NULL AND _current_participants >= _event.max_participants THEN
        -- Add to waitlist
        SELECT COALESCE(MAX(position), 0) + 1 INTO _waitlist_position
        FROM event_waitlist
        WHERE event_id = _event_id;

        INSERT INTO event_waitlist (event_id, user_id, position)
        VALUES (_event_id, _user_id, _waitlist_position);

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Added to waitlist',
            'status', 'waitlisted',
            'waitlist_position', _waitlist_position
        );
    ELSE
        -- Register for event
        INSERT INTO event_participants (event_id, user_id)
        VALUES (_event_id, _user_id);

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Successfully registered for event',
            'status', 'registered'
        );
    END IF;
END;
$$;

-- Function to promote waitlist users when spot opens
CREATE OR REPLACE FUNCTION public.promote_waitlist_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _event RECORD;
    _current_participants INTEGER;
    _next_waitlist_user RECORD;
BEGIN
    -- Only process when someone leaves an event
    IF TG_OP = 'DELETE' THEN
        -- Get event details
        SELECT * INTO _event
        FROM events
        WHERE id = OLD.event_id;

        -- Check if event has capacity limit
        IF _event.max_participants IS NOT NULL THEN
            -- Get current participant count
            SELECT COUNT(*) INTO _current_participants
            FROM event_participants
            WHERE event_id = OLD.event_id;

            -- If there's space and waitlist exists
            IF _current_participants < _event.max_participants THEN
                -- Get next person on waitlist
                SELECT * INTO _next_waitlist_user
                FROM event_waitlist
                WHERE event_id = OLD.event_id
                ORDER BY position ASC
                LIMIT 1;

                IF FOUND THEN
                    -- Move from waitlist to participants
                    INSERT INTO event_participants (event_id, user_id)
                    VALUES (OLD.event_id, _next_waitlist_user.user_id);

                    -- Remove from waitlist
                    DELETE FROM event_waitlist
                    WHERE id = _next_waitlist_user.id;

                    -- Update positions for remaining waitlist
                    UPDATE event_waitlist
                    SET position = position - 1
                    WHERE event_id = OLD.event_id
                    AND position > _next_waitlist_user.position;

                    -- Create notification for promoted user
                    INSERT INTO notifications (user_id, type, reference_id, message)
                    VALUES (
                        _next_waitlist_user.user_id,
                        'event',
                        OLD.event_id,
                        'A spot opened up! You have been registered for: ' || _event.title
                    );
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NULL;
END;
$$;

-- Create trigger for waitlist promotion
DROP TRIGGER IF EXISTS trigger_promote_waitlist ON public.event_participants;
CREATE TRIGGER trigger_promote_waitlist
    AFTER DELETE ON public.event_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.promote_waitlist_user();

-- Enable realtime for event_waitlist
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_waitlist;