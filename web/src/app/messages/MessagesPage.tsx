import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { MessageThread } from '../../lib/types';
import { Avatar, EmptyState, ListSkeleton, SecondaryButton } from '../../components/ui';
import { IconMessages } from '../../components/Icons';

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function MessagesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['messages', 'threads'],
    queryFn: () => api.get<{ threads: MessageThread[] }>('/messages'),
  });

  const threads = data?.threads ?? [];

  return (
    <div className="px-4 py-6">
      <h1 className="font-bold text-xl mb-4">Messages</h1>

      {isLoading && <ListSkeleton />}

      {!isLoading && threads.length === 0 && (
        <EmptyState
          icon={<IconMessages width={36} height={36} />}
          title="No conversations yet"
          description="Message someone from the directory to start a conversation."
          action={
            <Link to="/app/directory">
              <SecondaryButton>Browse directory</SecondaryButton>
            </Link>
          }
        />
      )}

      {!isLoading && threads.length > 0 && (
        <div className="space-y-1">
          {threads.map((t) =>
            t.profile ? (
              <Link
                key={t.profile.id}
                to={`/app/messages/${t.profile.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors"
              >
                <Avatar firstName={t.profile.firstName} lastName={t.profile.lastName} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate">
                      {t.profile.firstName} {t.profile.lastName}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{formatTime(t.lastMessage.sentAt)}</span>
                  </div>
                  <p className={`text-sm truncate ${t.unread > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                    {t.lastMessage.fromMe ? 'You: ' : ''}
                    {t.lastMessage.body}
                  </p>
                </div>
                {t.unread > 0 && <span className="w-2 h-2 rounded-full bg-ref-red shrink-0" />}
              </Link>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
