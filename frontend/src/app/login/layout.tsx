import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in — EduPlus',
  description: 'Sign in or create your EduPlus account',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
