import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ListSkeleton, VerifiedBadge } from '../../components/ui';

interface AdminUserDetail {
  id: string;
  email: string;
  isClaimed: boolean;
  claimCode: string | null;
  createdAt: string;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    country: string;
    refProgram: string;
    cohortYear: number;
    verifiedAt: string | null;
    profession: string | null;
    bio: string | null;
    skills: string;
    currentLocation: string | null;
  } | null;
  auditLogs: { id: string; action: string; details: string | null; createdAt: string; staffEmail: string }[];
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => api.get<AdminUserDetail>(`/admin/users/${id}`),
    enabled: !!id,
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [refProgram, setRefProgram] = useState('');
  const [cohortYear, setCohortYear] = useState(2015);

  useEffect(() => {
    if (data?.profile) {
      setFirstName(data.profile.firstName);
      setLastName(data.profile.lastName);
      setCountry(data.profile.country);
      setRefProgram(data.profile.refProgram);
      setCohortYear(data.profile.cohortYear);
    }
  }, [data]);

  const verify = useMutation({
    mutationFn: () =>
      api.patch(`/admin/users/${id}/verify`, { firstName, lastName, country, refProgram, cohortYear }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] }),
  });

  if (isLoading || !data) return <ListSkeleton />;

  let skills: string[] = [];
  try {
    skills = JSON.parse(data.profile?.skills ?? '[]');
  } catch {
    skills = [];
  }

  return (
    <div className="max-w-3xl">
      <Link to="/users" className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to users
      </Link>
      <h1 className="font-bold text-2xl mt-2 mb-1">
        {data.profile ? `${data.profile.firstName} ${data.profile.lastName}` : data.email}
      </h1>
      <p className="text-sm text-gray-500 mb-6">{data.email}</p>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">REF-verified fields</h2>
            <VerifiedBadge />
          </div>
          <div className="space-y-3">
            <Field label="First name" value={firstName} onChange={setFirstName} />
            <Field label="Last name" value={lastName} onChange={setLastName} />
            <Field label="Country" value={country} onChange={setCountry} />
            <Field label="Program" value={refProgram} onChange={setRefProgram} />
            <Field label="Cohort year" value={String(cohortYear)} onChange={(v) => setCohortYear(Number(v) || 0)} />
          </div>
          <button
            onClick={() => verify.mutate()}
            disabled={verify.isPending}
            className="mt-4 w-full bg-ref-red text-white text-sm font-semibold py-2 rounded-lg hover:bg-ref-redDark disabled:opacity-50"
          >
            {verify.isPending ? 'Saving…' : 'Save & mark verified'}
          </button>
          {data.profile?.verifiedAt && (
            <p className="text-xs text-gray-400 mt-2">Last verified {new Date(data.profile.verifiedAt).toLocaleString()}</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold mb-3">User-maintained fields</h2>
            <p className="text-xs text-gray-400 mb-3">Read-only here — edited by the user themselves.</p>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-400">Profession</dt>
                <dd>{data.profile?.profession || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Location</dt>
                <dd>{data.profile?.currentLocation || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-400 mb-1">Skills</dt>
                <dd className="flex flex-wrap gap-1">
                  {skills.length > 0 ? (
                    skills.map((s) => (
                      <span key={s} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400 mb-1">Bio</dt>
                <dd className="text-gray-700">{data.profile?.bio || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold mb-1">Claim status</h2>
            {data.isClaimed ? (
              <p className="text-sm text-emerald-700">Claimed by the alumnus.</p>
            ) : (
              <div className="text-sm">
                <p className="text-amber-700 mb-1">Not yet claimed.</p>
                <p className="text-gray-500">
                  Claim code: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{data.claimCode}</code>
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold mb-3">Verification audit trail</h2>
            {data.auditLogs.length === 0 ? (
              <p className="text-sm text-gray-400">No actions logged yet.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {data.auditLogs.map((log) => (
                  <li key={log.id} className="border-l-2 border-ref-red/30 pl-3">
                    <p className="text-gray-800">{log.details ?? log.action}</p>
                    <p className="text-xs text-gray-400">
                      {log.staffEmail} · {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-400">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ref-red/30"
      />
    </div>
  );
}
