import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Message } from '../../lib/types';
import { Avatar, ListSkeleton, PrimaryButton } from '../../components/ui';

interface ThreadData {
  profile: { id: string; firstName: string; lastName: string; profession: string | null } | null;
  messages: Message[];
}

export default function ConversationPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['messages', profileId],
    queryFn: () => api.get<ThreadData>(`/messages/${profileId}`),
    enabled: !!profileId,
  });

  const send = useMutation({
    mutationFn: (body: string) => api.post<Message>('/messages', { recipientProfileId: profileId, body }),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['messages', profileId] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'threads'] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages.length]);

  if (isLoading || !data) return <ListSkeleton />;

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    send.mutate(draft.trim());
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-14 md:top-16 z-10">
        {data.profile && (
          <>
            <Avatar firstName={data.profile.firstName} lastName={data.profile.lastName} size="sm" />
            <div>
              <p className="font-semibold text-sm">
                {data.profile.firstName} {data.profile.lastName}
              </p>
              <p className="text-xs text-gray-500">{data.profile.profession}</p>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {data.messages.map((m) => (
          <div key={m.id} className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                m.fromMe ? 'bg-ref-red text-white' : 'bg-white border border-gray-100 text-gray-800'
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-gray-100 bg-white">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ref-red/30 focus:border-ref-red"
        />
        <PrimaryButton type="submit" disabled={send.isPending || !draft.trim()}>
          Send
        </PrimaryButton>
      </form>
    </div>
  );
}
