import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Opportunity, OpportunityType } from '../../lib/types';
import { ListSkeleton } from '../../components/ui';

const TYPES: OpportunityType[] = ['SCHOLARSHIP', 'JOB', 'INTERNSHIP', 'TRAINING', 'GRANT', 'EVENT', 'OTHER'];

const emptyForm = {
  title: '',
  description: '',
  type: 'SCHOLARSHIP' as OpportunityType,
  country: '',
  deadline: '',
  url: '',
};

export default function AdminOpportunitiesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'opportunities'],
    queryFn: () => api.get<{ results: Opportunity[] }>('/admin/opportunities'),
  });

  const create = useMutation({
    mutationFn: () => api.post('/admin/opportunities', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'opportunities'] });
      setShowForm(false);
      setForm(emptyForm);
    },
  });

  const update = useMutation({
    mutationFn: () => api.patch(`/admin/opportunities/${editingId}`, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'opportunities'] });
      setEditingId(null);
      setShowForm(false);
      setForm(emptyForm);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/opportunities/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'opportunities'] }),
  });

  function startEdit(o: Opportunity) {
    setEditingId(o.id);
    setForm({
      title: o.title,
      description: o.description,
      type: o.type,
      country: o.country,
      deadline: o.deadline.slice(0, 10),
      url: o.url ?? '',
    });
    setShowForm(true);
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  const results = data?.results ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-bold text-2xl">Opportunities</h1>
        <button
          onClick={startNew}
          className="bg-ref-red text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-ref-redDark"
        >
          Post new
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            editingId ? update.mutate() : create.mutate();
          }}
          className="bg-white rounded-xl border border-gray-100 p-5 mb-5 grid grid-cols-2 gap-4"
        >
          <div className="col-span-2">
            <label className="text-xs text-gray-400">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-0.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-400">Description</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-0.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as OpportunityType })}
              className="mt-0.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400">Country</label>
            <input
              required
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="mt-0.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Deadline</label>
            <input
              required
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="mt-0.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">URL (optional)</label>
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="mt-0.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={create.isPending || update.isPending}
              className="bg-ref-red text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-ref-redDark disabled:opacity-50"
            >
              {editingId ? 'Save changes' : 'Post opportunity'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <ListSkeleton />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Country</th>
                <th className="text-left px-4 py-3">Deadline</th>
                <th className="text-left px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{o.title}</td>
                  <td className="px-4 py-3 text-gray-600">{o.type}</td>
                  <td className="px-4 py-3 text-gray-600">{o.country}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(o.deadline).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => startEdit(o)} className="text-ref-red font-medium">
                      Edit
                    </button>
                    <button onClick={() => remove.mutate(o.id)} className="text-gray-400 hover:text-red-600">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
