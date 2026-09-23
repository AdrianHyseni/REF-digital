import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import type { Profile } from '../../lib/types';
import { Avatar, ListSkeleton, MentorBadge, PrimaryButton, SecondaryButton, SeekingBadge, VerifiedBadge } from '../../components/ui';

export default function ProfileDetailPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [category, setCategory] = useState('Career');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => api.get<Profile>(`/directory/${profileId}`),
    enabled: !!profileId,
  });

  const requestMentorship = useMutation({
    mutationFn: () => api.post('/mentorship/request', { mentorProfileId: profileId, category }),
    onSuccess: () => setRequestSent(true),
    onError: (err) => setRequestError(err instanceof ApiError ? err.message : 'Something went wrong'),
  });

  if (isLoading || !profile) return <ListSkeleton />;

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col items-center text-center mb-6">
        <Avatar firstName={profile.firstName} lastName={profile.lastName} size="lg" />
        <h1 className="font-bold text-xl mt-3">
          {profile.firstName} {profile.lastName}
        </h1>
        <p className="text-sm text-gray-500">{profile.profession ?? profile.country}</p>
        <div className="flex gap-2 mt-2">
          {profile.mentorAvailable && <MentorBadge />}
          {profile.seekingMentor && <SeekingBadge />}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <SecondaryButton full onClick={() => navigate(`/app/messages/${profile.id}`)}>
          Message
        </SecondaryButton>
        {profile.mentorAvailable && (
          <PrimaryButton full onClick={() => requestMentorship.mutate()} disabled={requestMentorship.isPending || requestSent}>
            {requestSent ? 'Request sent' : 'Request mentorship'}
          </PrimaryButton>
        )}
      </div>
      {requestError && <p className="text-sm text-red-600 mb-4">{requestError}</p>}

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
      </section>

      {profile.bio && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <h2 className="font-semibold text-sm text-gray-700 mb-2">About</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
        </section>
      )}

      {profile.skills && profile.skills.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <h2 className="font-semibold text-sm text-gray-700 mb-2">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {profile.currentLocation && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <h2 className="font-semibold text-sm text-gray-700 mb-1">Current location</h2>
          <p className="text-sm text-gray-600">{profile.currentLocation}</p>
        </section>
      )}

      {profile.contactEmail && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <h2 className="font-semibold text-sm text-gray-700 mb-1">Contact</h2>
          <p className="text-sm text-gray-600">{profile.contactEmail}</p>
        </section>
      )}

      {profile.mentorAvailable && !requestSent && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-semibold text-sm text-gray-700 mb-2">Request mentorship category</h2>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          >
            {['Education', 'Career', 'Technology', 'Entrepreneurship', 'Leadership'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </section>
      )}
    </div>
  );
}
