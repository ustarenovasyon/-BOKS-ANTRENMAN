import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, Dumbbell, History, Settings } from 'lucide-react';

const items = [
  { to: '/', label: 'Ana Sayfa', icon: Home },
  { to: '/programs', label: 'Programlarım', icon: ClipboardList },
  { to: '/workout', label: 'Antrenman', icon: Dumbbell },
  { to: '/history', label: 'Geçmiş', icon: History },
  { to: '/settings', label: 'Ayarlar', icon: Settings },
];

export default function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background">
      <div
        className="mx-auto max-w-md grid grid-cols-5"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] transition-colors ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}