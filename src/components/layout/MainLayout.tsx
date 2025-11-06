import type { ReactNode } from 'react';
import { TabBar } from '../common';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TabBar />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
