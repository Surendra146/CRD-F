import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const [navigationOpen, setNavigationOpen] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (desktop.matches) setNavigationOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Dialog.Root open={navigationOpen} onOpenChange={setNavigationOpen}>
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <Dialog.Trigger asChild>
            <button type="button" aria-label="Open navigation" className="rounded-lg p-3 text-gray-700 hover:bg-gray-100"><Menu className="h-5 w-5" /></button>
          </Dialog.Trigger>
          <span className="text-sm font-semibold">HanuRam Tech</span>
        </div>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 max-w-[calc(100vw-2rem)] bg-gray-900 lg:hidden" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">Application navigation</Dialog.Title>
            <Sidebar mobile onNavigate={() => setNavigationOpen(false)} />
            <Dialog.Close asChild>
              <button type="button" aria-label="Close navigation" className="absolute right-2 top-2 rounded-lg p-3 text-white hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <main className="min-w-0 min-h-screen lg:ml-64"><Outlet /></main>
    </div>
  );
}
