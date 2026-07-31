ALTER TABLE public.conversations ADD COLUMN created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE;

DROP POLICY "conversations create" ON public.conversations;
CREATE POLICY "conversations create" ON public.conversations FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY "conversations participant read" ON public.conversations;
CREATE POLICY "conversations participant read" ON public.conversations FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.is_conversation_participant(id, auth.uid()));

DROP POLICY "participants insert" ON public.conversation_participants;
CREATE POLICY "participants insert" ON public.conversation_participants FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.is_conversation_participant(conversation_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
);

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;