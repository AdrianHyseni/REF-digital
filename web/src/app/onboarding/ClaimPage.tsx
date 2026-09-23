import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { api, ApiError } from '../../lib/api';
import { PrimaryButton, VerifiedBadge } from '../../components/ui';

interface LookupResult {
  firstName: string;
  lastName: string;
  country: string;
  refProgram: string;
  cohortYear: number;
}

const STEPS = ['Claim code', 'Set password', 'Complete'];

export default function ClaimPage() {
  const { claim } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [claimCode, setClaimCode] = useState('');
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.post<LookupResult>('/auth/claim/lookup', { claimCode });
      setLookup(result);
      setStep(1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await claim(claimCode, password);
      setStep(2);
      setTimeout(() => navigate('/onboarding/complete-profile'), 900);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  i <= step ? 'bg-ref-red text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < step ? 'bg-ref-red' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <form onSubmit={handleLookup} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-lg">Claim your profile</h2>
            <p className="text-sm text-gray-500">
              Enter the claim code REF sent you to find your existing record and make it your own.
            </p>
            <input
              required
              value={claimCode}
              onChange={(e) => setClaimCode(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-ref-red/30 focus:border-ref-red"
              placeholder="REF-XXXXXXXX"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <PrimaryButton type="submit" full disabled={loading}>
              {loading ? 'Looking up…' : 'Find my profile'}
            </PrimaryButton>
            <Link to="/login" className="block text-center text-sm text-gray-500 hover:text-gray-700">
              Back to login
            </Link>
          </form>
        )}

        {step === 1 && lookup && (
          <form onSubmit={handleClaim} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Is this you?</h2>
              <VerifiedBadge />
            </div>
            <div className="bg-ref-redLight rounded-xl p-4 space-y-1">
              <p className="font-semibold text-gray-900">
                {lookup.firstName} {lookup.lastName}
              </p>
              <p className="text-sm text-gray-600">{lookup.country}</p>
              <p className="text-sm text-gray-600">
                {lookup.refProgram} · Cohort {lookup.cohortYear}
              </p>
            </div>
            <p className="text-sm text-gray-600">Set a password to claim this profile as your own.</p>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ref-red/30 focus:border-ref-red"
              placeholder="Choose a password (min 6 characters)"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <PrimaryButton type="submit" full disabled={loading}>
              {loading ? 'Claiming…' : 'Claim my profile'}
            </PrimaryButton>
          </form>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-2">
            <div className="text-4xl">🎉</div>
            <h2 className="font-semibold text-lg">Welcome, {lookup?.firstName}!</h2>
            <p className="text-sm text-gray-500">Let's finish setting up your profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
