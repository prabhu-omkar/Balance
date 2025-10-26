import type { ReactNode } from 'react';
import Navbar from './Navbar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-accent/20 selection:text-primary">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 md:py-12 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
