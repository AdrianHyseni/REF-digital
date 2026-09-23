import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Profile } from '../../lib/types';
import { Avatar, PrimaryButton, SecondaryButton } from '../../components/ui';

const SKILL_SUGGESTIONS = [
  'Project Management',
  'Public Speaking',
  'Grant Writing',
  'Community Outreach',
  'Data Analysis',
  'Web Development',
  'Advocacy',
  'Mentoring',
];

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['profile', 'me'], queryFn: () => api.get<Profile>('/profiles/me') });

  const [bio, setBio] = useState('');
  const [profession, setProfession] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: () => api.patch<Profile>('/profiles/me', { bio, profession, skills }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      navigate('/app/profile');
    },
  });

  function toggleSkill(skill: string) {
    setSkills((s) => (s.includes(skill) ? s.filter((x) => x !== skill) : [...s, skill]));
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-sm mx-auto">
        <div className="flex flex-col items-center mb-6">
          <Avatar firstName={profile.firstName} lastName={profile.lastName} size="lg" />
          <h1 className="font-bold text-xl mt-3">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-sm text-gray-500">
            {profile.refProgram} · {profile.country}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">What do you do?</label>
            <input
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="e.g. Primary School Teacher"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ref-red/30 focus:border-ref-red"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">A short bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell other alumni a bit about yourself"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ref-red/30 focus:border-ref-red"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Skills</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SKILL_SUGGESTIONS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    skills.includes(skill) ? 'bg-ref-red text-white border-ref-red' : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <PrimaryButton full onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Finish profile'}
          </PrimaryButton>
          <SecondaryButton full onClick={() => navigate('/app/profile')}>
            Skip for now
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
