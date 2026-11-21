import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageTransition } from '@/components/layout/PageTransition';

export const metadata: Metadata = {
  title: 'EduPlus',
  description: 'Academic workspace for students and educators.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className="min-h-screen bg-[#f7f8f5] text-[#171918] antialiased">
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <div className="flex min-h-0 flex-1">
                <Sidebar />
                <main className="w-full flex-1 px-4 py-5 md:px-7 md:py-7 xl:px-8 xl:py-8 overflow-y-auto">
                  <PageTransition>{children}</PageTransition>
                </main>
              </div>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
