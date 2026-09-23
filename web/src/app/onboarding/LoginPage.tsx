import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { PrimaryButton, SecondaryButton } from '../../components/ui';
import { ApiError } from '../../lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'STAFF' ? '/admin/users' : '/app/profile');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-ref-red text-white flex items-center justify-center font-bold text-xl mb-3">
            R
          </div>
          <h1 className="text-xl font-bold">REF Network</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Connecting Roma Education Fund alumni across the region
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ref-red/30 focus:border-ref-red"
              placeholder="you@example.org"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ref-red/30 focus:border-ref-red"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <PrimaryButton type="submit" full disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </PrimaryButton>
        </form>

        <div className="mt-4">
          <Link to="/claim">
            <SecondaryButton full>I have a claim code</SecondaryButton>
          </Link>
        </div>

        <div className="mt-8 text-xs text-gray-400 bg-gray-100 rounded-xl p-3 leading-relaxed">
          <p className="font-semibold text-gray-500 mb-1">Demo logins</p>
          <p>Alumnus: demo.alumnus@example.org / demo1234</p>
          <p>Staff: staff.romania@ref.org / demo1234</p>
        </div>
      </div>
    </div>
  );
}
