import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const NAV = [
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/opportunities', label: 'Opportunities' },
  { to: '/admin/analytics', label: 'Analytics' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-ref-red text-white flex items-center justify-center font-bold">R</div>
          <div>
            <div className="font-semibold text-sm leading-tight">REF Network</div>
            <div className="text-xs text-gray-400 leading-tight">Staff dashboard</div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-ref-redLight text-ref-red' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="text-xs text-gray-400 truncate mb-2">{user?.email}</div>
          <button onClick={() => logout()} className="text-sm text-gray-500 hover:text-gray-800">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-x-auto">
        <div className="min-w-[900px] p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
