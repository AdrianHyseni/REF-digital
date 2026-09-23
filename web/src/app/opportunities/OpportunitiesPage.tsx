import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Opportunity, OpportunityType } from '../../lib/types';
import { EmptyState, ListSkeleton, PillButton } from '../../components/ui';
import { IconOpportunities } from '../../components/Icons';

const TYPES: { value: OpportunityType; label: string }[] = [
  { value: 'SCHOLARSHIP', label: 'Scholarships' },
  { value: 'JOB', label: 'Jobs' },
  { value: 'INTERNSHIP', label: 'Internships' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'GRANT', label: 'Grants' },
  { value: 'EVENT', label: 'Events' },
];

const TYPE_COLORS: Record<string, string> = {
  SCHOLARSHIP: 'bg-violet-50 text-violet-700',
  JOB: 'bg-sky-50 text-sky-700',
  INTERNSHIP: 'bg-emerald-50 text-emerald-700',
  TRAINING: 'bg-amber-50 text-amber-700',
  GRANT: 'bg-rose-50 text-rose-700',
  EVENT: 'bg-orange-50 text-orange-700',
  OTHER: 'bg-gray-50 text-gray-700',
};

function daysUntil(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function OpportunitiesPage() {
  const [type, setType] = useState<OpportunityType | null>(null);
  const [country, setCountry] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (country) params.set('country', country);

  const { data, isLoading } = useQuery({
    queryKey: ['opportunities', type, country],
    queryFn: () => api.get<{ results: Opportunity[] }>(`/opportunities?${params.toString()}`),
  });

  const results = data?.results ?? [];
  const countries = Array.from(new Set(results.map((o) => o.country))).sort();

  return (
    <div className="px-4 py-6">
      <h1 className="font-bold text-xl mb-4">Opportunities</h1>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-2">
        {TYPES.map((t) => (
          <PillButton key={t.value} active={type === t.value} onClick={() => setType(type === t.value ? null : t.value)}>
            {t.label}
          </PillButton>
        ))}
      </div>
      {countries.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-2">
          {countries.map((c) => (
            <PillButton key={c} active={country === c} onClick={() => setCountry(country === c ? null : c)}>
              {c}
            </PillButton>
          ))}
        </div>
      )}

      {isLoading && <ListSkeleton />}

      {!isLoading && results.length === 0 && (
        <EmptyState
          icon={<IconOpportunities width={36} height={36} />}
          title="No opportunities match"
          description="Try clearing a filter to see more listings."
        />
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-3 mt-2">
          {results.map((o) => {
            const days = daysUntil(o.deadline);
            return (
              <div key={o.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[o.type]}`}>
                    {TYPES.find((t) => t.value === o.type)?.label.replace(/s$/, '') ?? o.type}
                  </span>
                  <span className={`text-xs font-medium shrink-0 ${days <= 7 ? 'text-red-600' : 'text-gray-400'}`}>
                    {days > 0 ? `${days}d left` : 'Closed'}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mt-2">{o.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{o.country}</p>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{o.description}</p>
                {o.url && (
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-3 text-sm font-medium text-ref-red"
                  >
                    Learn more →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
