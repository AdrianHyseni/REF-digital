import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ListSkeleton } from '../../components/ui';

interface Analytics {
  totalUsers: number;
  claimedUsers: number;
  claimRate: number;
  avgProfileCompletion: number;
  activeMentorPairs: number;
  directorySearchCount: number;
  signupsOverTime: { date: string; count: number }[];
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => api.get<Analytics>('/admin/analytics'),
  });

  if (isLoading || !data) return <ListSkeleton />;

  const maxCount = Math.max(1, ...data.signupsOverTime.map((d) => d.count));

  return (
    <div>
      <h1 className="font-bold text-2xl mb-5">Analytics</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total sign-ups" value={data.totalUsers} />
        <StatCard label="Claim rate" value={`${data.claimRate}%`} sub={`${data.claimedUsers} of ${data.totalUsers} claimed`} />
        <StatCard label="Avg. profile completion" value={`${data.avgProfileCompletion}%`} />
        <StatCard label="Active mentor pairs" value={data.activeMentorPairs} />
        <StatCard label="Directory searches" value={data.directorySearchCount} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold mb-4">Sign-ups over time</h2>
        <div className="flex items-end gap-1 h-40">
          {data.signupsOverTime.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <div
                className="w-full bg-ref-red/80 rounded-t hover:bg-ref-red transition-colors"
                style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: 4 }}
                title={`${d.date}: ${d.count}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{data.signupsOverTime[0]?.date}</span>
          <span>{data.signupsOverTime[data.signupsOverTime.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
}
