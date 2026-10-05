import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — AcademiQ',
  description: 'Sign in or create your AcademiQ account',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
