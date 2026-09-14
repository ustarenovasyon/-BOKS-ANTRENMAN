import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

/**
 * Ortak uygulama kabuğu: mobil öncelikli içerik alanı + alt navigation.
 * pb-24 alt barın içeriği kapatmasını önler; safe-area alt nav içinde ayarlı.
 */
export default function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-md px-4 pb-24 pt-6">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}