import { NavLink, Outlet } from 'react-router-dom';
import { IconUser, IconDirectory, IconOpportunities, IconMessages } from './Icons';

const TABS = [
  { to: '/app/profile', label: 'Profile', icon: IconUser },
  { to: '/app/directory', label: 'Directory', icon: IconDirectory },
  { to: '/app/opportunities', label: 'Opportunities', icon: IconOpportunities },
  { to: '/app/messages', label: 'Messages', icon: IconMessages },
];

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="hidden md:flex items-center justify-between px-6 h-16 bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-ref-red text-white flex items-center justify-center font-bold">R</div>
          <span className="font-semibold text-lg">REF Network</span>
        </div>
        <nav className="flex items-center gap-1">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-ref-redLight text-ref-red' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <header className="md:hidden flex items-center justify-center h-14 bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-ref-red text-white flex items-center justify-center font-bold text-xs">R</div>
          <span className="font-semibold">REF Network</span>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-6 max-w-3xl w-full mx-auto">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 px-1 z-20">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-medium ${
                  isActive ? 'text-ref-red' : 'text-gray-400'
                }`
              }
            >
              <Icon width={20} height={20} />
              {tab.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
