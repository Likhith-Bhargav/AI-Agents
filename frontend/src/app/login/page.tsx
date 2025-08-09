import { Metadata } from 'next';
import LoginPageClient from './LoginPageClient';

export const metadata: Metadata = {
  title: 'Sign in to your account - Support Chat',
  description: 'Sign in to your Support Chat account to manage your support agents and tickets.',
};

export default function LoginPage() {
  return <LoginPageClient />;
}
