import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { MentorshipConnection } from '../../lib/types';
import { useAuth } from '../../lib/auth';
import { Avatar, EmptyState, ListSkeleton, PillButton, PrimaryButton, SecondaryButton } from '../../components/ui';
import { IconMentor } from '../../components/Icons';

interface MentorshipData {
  accepted: MentorshipConnection[];
  requestsIncoming: MentorshipConnection[];
  requestsOutgoing: MentorshipConnection[];
  declined: MentorshipConnection[];
}

export default function MentorshipPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'connections' | 'requests'>('connections');

  const { data, isLoading } = useQuery({
    queryKey: ['mentorship'],
    queryFn: () => api.get<MentorshipData>('/mentorship'),
  });

  const respond = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACCEPTED' | 'DECLINED' }) => api.patch(`/mentorship/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mentorship'] }),
  });

  if (isLoading || !data) return <ListSkeleton />;

  const pendingCount = data.requestsIncoming.length;

  function otherPerson(conn: MentorshipConnection) {
    return conn.mentor.id === user?.profileId ? conn.mentee : conn.mentor;
  }

  return (
    <div className="px-4 py-6">
      <h1 className="font-bold text-xl mb-4">Mentorship</h1>

      <div className="flex gap-2 mb-4">
        <PillButton active={tab === 'connections'} onClick={() => setTab('connections')}>
          My mentors/mentees
        </PillButton>
        <PillButton active={tab === 'requests'} onClick={() => setTab('requests')}>
          Requests {pendingCount > 0 && `(${pendingCount})`}
        </PillButton>
      </div>

      {tab === 'connections' && (
        <>
          {data.accepted.length === 0 ? (
            <EmptyState
              icon={<IconMentor width={36} height={36} />}
              title="No connections yet"
              description="Browse the directory to find a mentor, or flag yourself as available to mentor others."
              action={
                <Link to="/app/directory">
                  <SecondaryButton>Browse directory</SecondaryButton>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {data.accepted.map((conn) => {
                const other = otherPerson(conn);
                const role = conn.mentor.id === user?.profileId ? 'Mentee' : 'Mentor';
                return (
                  <Link
                    key={conn.id}
                    to={`/app/messages/${other.id}`}
                    className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3"
                  >
                    <Avatar firstName={other.firstName} lastName={other.lastName} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {other.firstName} {other.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {role} · {conn.category}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'requests' && (
        <>
          {data.requestsIncoming.length === 0 && data.requestsOutgoing.length === 0 ? (
            <EmptyState
              icon={<IconMentor width={36} height={36} />}
              title="No pending requests"
              description="When someone requests mentorship from you, or you request it from someone, it'll show up here."
            />
          ) : (
            <div className="space-y-4">
              {data.requestsIncoming.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Incoming</h3>
                  <div className="space-y-2">
                    {data.requestsIncoming.map((conn) => (
                      <div key={conn.id} className="bg-white rounded-xl border border-gray-100 p-3">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar firstName={conn.mentee.firstName} lastName={conn.mentee.lastName} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {conn.mentee.firstName} {conn.mentee.lastName}
                            </p>
                            <p className="text-xs text-gray-500">Requesting mentorship · {conn.category}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <PrimaryButton full onClick={() => respond.mutate({ id: conn.id, status: 'ACCEPTED' })}>
                            Accept
                          </PrimaryButton>
                          <SecondaryButton full onClick={() => respond.mutate({ id: conn.id, status: 'DECLINED' })}>
                            Decline
                          </SecondaryButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.requestsOutgoing.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Sent by you</h3>
                  <div className="space-y-2">
                    {data.requestsOutgoing.map((conn) => (
                      <div key={conn.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3">
                        <Avatar firstName={conn.mentor.firstName} lastName={conn.mentor.lastName} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {conn.mentor.firstName} {conn.mentor.lastName}
                          </p>
                          <p className="text-xs text-gray-500">Awaiting response · {conn.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
