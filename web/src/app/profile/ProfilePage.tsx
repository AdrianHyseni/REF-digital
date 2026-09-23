import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Profile } from '../../lib/types';
import { useAuth } from '../../lib/auth';
import { Avatar, MentorBadge, PrimaryButton, SeekingBadge, VerifiedBadge } from '../../components/ui';
import { ListSkeleton } from '../../components/ui';

function EditableField({
  label,
  value,
  onSave,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  if (editing) {
    const Field = multiline ? 'textarea' : 'input';
    return (
      <div className="py-3 border-b border-gray-100 last:border-0">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>
        <Field
          autoFocus
          value={draft}
          rows={multiline ? 3 : undefined}
          onChange={(e: any) => setDraft(e.target.value)}
          className="mt-1 w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ref-red/30 focus:border-ref-red"
        />
        <div className="flex gap-2 mt-2">
          <button
            className="text-sm font-medium text-ref-red"
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
          >
            Save
          </button>
          <button className="text-sm text-gray-400" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full text-left py-3 border-b border-gray-100 last:border-0 group"
    >
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</div>
      <div className={`text-sm mt-0.5 ${value ? 'text-gray-800' : 'text-gray-400 italic'}`}>
        {value || placeholder || 'Tap to add'}
      </div>
    </button>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => api.get<Profile>('/profiles/me'),
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<Profile>) => api.patch<Profile>('/profiles/me', data),
    onSuccess: (data) => queryClient.setQueryData(['profile', 'me'], data),
  });

  const toggleMentor = useMutation({
    mutationFn: (mentorAvailable: boolean) => api.patch<Profile>('/profiles/me', { mentorAvailable }),
    onSuccess: (data) => queryClient.setQueryData(['profile', 'me'], data),
  });

  if (isLoading || !profile) return <ListSkeleton />;

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col items-center text-center mb-6">
        <Avatar firstName={profile.firstName} lastName={profile.lastName} size="lg" />
        <h1 className="font-bold text-xl mt-3">
          {profile.firstName} {profile.lastName}
        </h1>
        <p className="text-sm text-gray-500">{profile.profession || 'No profession set yet'}</p>
        <div className="flex gap-2 mt-2">
          {profile.mentorAvailable && <MentorBadge />}
          {profile.seekingMentor && <SeekingBadge />}
        </div>
        <p className="text-xs text-gray-400 mt-3">{user?.email}</p>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm text-gray-700">REF-verified</h2>
          <VerifiedBadge />
        </div>
        <dl className="text-sm divide-y divide-gray-100">
          <div className="py-2 flex justify-between">
            <dt className="text-gray-400">Country</dt>
            <dd className="text-gray-800">{profile.country}</dd>
          </div>
          <div className="py-2 flex justify-between">
            <dt className="text-gray-400">Program</dt>
            <dd className="text-gray-800 text-right">{profile.refProgram}</dd>
          </div>
          <div className="py-2 flex justify-between">
            <dt className="text-gray-400">Cohort year</dt>
            <dd className="text-gray-800">{profile.cohortYear}</dd>
          </div>
        </dl>
        <p className="text-xs text-gray-400 mt-2">Verified by REF staff — only staff can edit these fields.</p>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="font-semibold text-sm text-gray-700 mb-1">Your details</h2>
        <EditableField
          label="Profession"
          value={profile.profession ?? ''}
          onSave={(v) => mutation.mutate({ profession: v })}
        />
        <EditableField
          label="Bio"
          value={profile.bio ?? ''}
          multiline
          onSave={(v) => mutation.mutate({ bio: v })}
        />
        <EditableField
          label="Current location"
          value={profile.currentLocation ?? ''}
          onSave={(v) => mutation.mutate({ currentLocation: v })}
        />
        <EditableField
          label="Contact email"
          value={profile.contactEmail ?? ''}
          onSave={(v) => mutation.mutate({ contactEmail: v })}
        />
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="font-semibold text-sm text-gray-700 mb-3">Mentorship</h2>
        <label className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-700">Available as a mentor</span>
          <input
            type="checkbox"
            checked={!!profile.mentorAvailable}
            onChange={(e) => toggleMentor.mutate(e.target.checked)}
            className="w-5 h-5 accent-ref-red"
          />
        </label>
        <label className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-700">Looking for a mentor</span>
          <input
            type="checkbox"
            checked={!!profile.seekingMentor}
            onChange={(e) => mutation.mutate({ seekingMentor: e.target.checked })}
            className="w-5 h-5 accent-ref-red"
          />
        </label>
        <Link to="/app/mentorship" className="block mt-2 text-sm font-medium text-ref-red">
          View my mentorship connections →
        </Link>
      </section>

      <Link to="/app/profile/visibility">
        <PrimaryButton full>Visibility settings</PrimaryButton>
      </Link>
    </div>
  );
}
