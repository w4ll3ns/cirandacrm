INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true);

CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Authenticated users can read chat media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-media');

CREATE POLICY "Public can read chat media"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'chat-media');

CREATE POLICY "Authenticated users can delete chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-media');

CREATE POLICY "Authenticated can update messages"
ON public.messages FOR UPDATE
TO authenticated
USING (true);