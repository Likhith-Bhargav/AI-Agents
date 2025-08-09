import { Metadata } from 'next';
import Link from 'next/link';
import SignupForm from '@/features/auth/components/SignupForm';

export const metadata: Metadata = {
  title: 'Create an account - Support Chat',
  description: 'Create a new account to get started with Support Chat.',
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/">
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <span className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Support Chat
              </span>
            </div>
          </div>
        </Link>
      </div>

      <SignupForm />

      <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          By signing up, you agree to our{' '}
          <Link
            href="/terms"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
