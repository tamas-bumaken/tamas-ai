-- Persistent Advisor chat history, kept until the user deletes the conversation or their account.
-- Messages can contain financial details, so every row is owner-only.

-- The id is created by the browser when a chat starts, so the first answer and later ones land in the same row
CREATE TABLE IF NOT EXISTS public.advisor_conversations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    -- The first question, shortened; no model call is spent on naming
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.advisor_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.advisor_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'model')),
    text TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 40000),
    -- The data access setting an answer was given under, shown again with its feedback buttons
    mode TEXT CHECK (mode IN ('personal', 'general')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.advisor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS advisor_conversations_user_updated_idx
    ON public.advisor_conversations (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS advisor_messages_conversation_created_idx
    ON public.advisor_messages (conversation_id, created_at);

CREATE POLICY "Users can view their own conversations" ON public.advisor_conversations
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own conversations" ON public.advisor_conversations
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own conversations" ON public.advisor_conversations
    FOR UPDATE USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own conversations" ON public.advisor_conversations
    FOR DELETE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view their own messages" ON public.advisor_messages
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- The conversation must be the caller's too, so a guessed id of someone else's conversation cannot receive messages
CREATE POLICY "Users can add messages to their own conversations" ON public.advisor_messages
    FOR INSERT WITH CHECK (
        (SELECT auth.uid()) = user_id
        AND EXISTS (
            SELECT 1 FROM public.advisor_conversations AS conversations
            WHERE conversations.id = conversation_id
                AND conversations.user_id = (SELECT auth.uid())
        )
    );
