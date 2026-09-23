import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Profile, Visibility } from '../../lib/types';
import { ListSkeleton, PrimaryButton } from '../../components/ui';

interface FieldGroup {
  key: string;
  title: string;
  description: string;
  fields: string[];
}

const GROUPS: FieldGroup[] = [
  {
    key: 'details',
    title: 'Career details',
    description: 'Your profession, bio, and current location.',
    fields: ['profession', 'bio', 'currentLocation'],
  },
  {
    key: 'skills',
    title: 'Skills & languages',
    description: 'What you can offer other alumni.',
    fields: ['skills', 'languages'],
  },
  {
    key: 'mentorship',
    title: 'Mentorship status',
    description: 'Whether you appear as a mentor or mentee to others.',
    fields: ['mentorAvailable', 'mentorCategories', 'seekingMentor', 'seekingCategories'],
  },
];

function groupVisibility(fieldVisibility: Record<string, Visibility> | undefined, group: FieldGroup, fallback: Visibility): Visibility {
  if (!fieldVisibility) return fallback;
  const value = fieldVisibility[group.fields[0]];
  return value ?? fallback;
}

export default function VisibilityPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => api.get<Profile>('/profiles/me'),
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<Profile>) => api.patch<Profile>('/profiles/me', data),
    onSuccess: (data) => queryClient.setQueryData(['profile', 'me'], data),
  });

  if (isLoading || !profile) return <ListSkeleton />;

  const fallback: Visibility = profile.visibility ?? 'NETWORK_ONLY';

  const setGroup = (group: FieldGroup, visibility: Visibility) => {
    const nextFieldVisibility = { ...(profile.fieldVisibility ?? {}) };
    for (const field of group.fields) nextFieldVisibility[field] = visibility;
    mutation.mutate({ fieldVisibility: nextFieldVisibility });
  };

  return (
    <div className="px-4 py-6">
      <h1 className="font-bold text-xl mb-1">Visibility settings</h1>
      <p className="text-sm text-gray-500 mb-6">
        Choose who can see each part of your profile. Your name, country, program and cohort year are always
        visible to other network members since REF has verified them.
      </p>

      <div className="space-y-3">
        {GROUPS.map((group) => {
          const current = groupVisibility(profile.fieldVisibility, group, fallback);
          return (
            <div key={group.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h2 className="font-semibold text-sm text-gray-800">{group.title}</h2>
              <p className="text-xs text-gray-500 mt-0.5 mb-3">{group.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setGroup(group, 'NETWORK_ONLY')}
                  className={`flex-1 text-sm font-medium py-2 rounded-xl border ${
                    current === 'NETWORK_ONLY' ? 'bg-ref-red text-white border-ref-red' : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  Network only
                </button>
                <button
                  onClick={() => setGroup(group, 'PRIVATE')}
                  className={`flex-1 text-sm font-medium py-2 rounded-xl border ${
                    current === 'PRIVATE' ? 'bg-ref-red text-white border-ref-red' : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  Only me
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {current === 'NETWORK_ONLY'
                  ? 'Visible to any logged-in REF alumnus who has claimed their profile.'
                  : 'Hidden from everyone except you and REF staff.'}
              </p>
            </div>
          );
        })}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-semibold text-sm text-gray-800">Contact email</h2>
          <p className="text-xs text-gray-500 mt-0.5 mb-3">
            Let other network members see your email address directly on your profile.
          </p>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Show my email to the network</span>
            <input
              type="checkbox"
              checked={!!profile.contactVisible}
              onChange={(e) => mutation.mutate({ contactVisible: e.target.checked })}
              className="w-5 h-5 accent-ref-red"
            />
          </label>
        </div>
      </div>

      <div className="mt-6">
        <PrimaryButton full onClick={() => navigate('/app/profile')}>
          Done
        </PrimaryButton>
      </div>
    </div>
  );
}
