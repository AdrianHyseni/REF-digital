import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ListSkeleton } from '../../components/ui';

interface AdminUserRow {
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
    mentorAvailable: boolean;
    completion: number;
  } | null;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'claimed' | 'unclaimed'>('all');

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status !== 'all') params.set('status', status);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search, status],
    queryFn: () => api.get<{ results: AdminUserRow[] }>(`/admin/users?${params.toString()}`),
  });

  const results = data?.results ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-bold text-2xl">Users</h1>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-ref-red/30"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="claimed">Claimed</option>
          <option value="unclaimed">Unclaimed</option>
        </select>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Country</th>
                <th className="text-left px-4 py-3">Claim status</th>
                <th className="text-left px-4 py-3">Completion</th>
                <th className="text-left px-4 py-3">Mentor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/admin/users/${u.id}`} className="font-medium text-gray-900 hover:text-ref-red">
                      {u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email}
                    </Link>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.profile?.country}</td>
                  <td className="px-4 py-3">
                    {u.isClaimed ? (
                      <span className="text-emerald-700 bg-emerald-50 text-xs font-medium px-2 py-0.5 rounded-full">Claimed</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-amber-700 bg-amber-50 text-xs font-medium px-2 py-0.5 rounded-full w-fit">
                          Unclaimed
                        </span>
                        <code className="text-[11px] text-gray-500">{u.claimCode}</code>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.profile?.completion ?? 0}%</td>
                  <td className="px-4 py-3 text-gray-600">{u.profile?.mentorAvailable ? 'Yes' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {results.length === 0 && <div className="p-8 text-center text-sm text-gray-400">No users match your search.</div>}
        </div>
      )}
    </div>
  );
}
