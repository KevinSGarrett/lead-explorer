import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lead Explorer',
  description: 'A modern frontend explorer for Directus collections',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <main className="flex flex-col min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}

