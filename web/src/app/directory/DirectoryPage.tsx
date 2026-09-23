import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { DirectoryCard } from '../../lib/types';
import { Avatar, EmptyState, ListSkeleton, MentorBadge, PillButton, SeekingBadge } from '../../components/ui';
import { IconDirectory } from '../../components/Icons';

const COUNTRIES = ['Albania', 'Romania', 'Serbia', 'North Macedonia', 'Bulgaria', 'Slovakia', 'Kosovo'];

export default function DirectoryPage() {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [mentorOnly, setMentorOnly] = useState(false);

  const params = new URLSearchParams();
  if (country) params.set('country', country);
  if (mentorOnly) params.set('mentorAvailable', 'true');
  if (search) params.set('q', search);

  const { data, isLoading } = useQuery({
    queryKey: ['directory', country, mentorOnly, search],
    queryFn: () => api.get<{ results: DirectoryCard[] }>(`/directory?${params.toString()}`),
  });

  const results = data?.results ?? [];

  return (
    <div className="px-4 py-6">
      <h1 className="font-bold text-xl mb-4">Directory</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, profession, or skill"
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-ref-red/30 focus:border-ref-red"
      />

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-2">
        <PillButton active={mentorOnly} onClick={() => setMentorOnly((v) => !v)}>
          Mentors only
        </PillButton>
        {COUNTRIES.map((c) => (
          <PillButton key={c} active={country === c} onClick={() => setCountry(country === c ? null : c)}>
            {c}
          </PillButton>
        ))}
      </div>

      {isLoading && <ListSkeleton />}

      {!isLoading && results.length === 0 && (
        <EmptyState
          icon={<IconDirectory width={40} height={40} />}
          title="No one found yet"
          description="Try a broader search or clear a filter to see more alumni."
        />
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-2 mt-2">
          {results.map((p) => (
            <Link
              key={p.id}
              to={`/app/directory/${p.id}`}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 hover:border-gray-200 transition-colors"
            >
              <Avatar firstName={p.firstName} lastName={p.lastName} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {p.firstName} {p.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {[p.profession, p.currentLocation ?? p.country].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex flex-col gap-1 items-end shrink-0">
                {p.mentorAvailable && <MentorBadge />}
                {p.seekingMentor && <SeekingBadge />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
