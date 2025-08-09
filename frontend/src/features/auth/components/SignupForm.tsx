'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Input from '@/components/form/Input';
import Button from '@/components/ui/button';
import Link from 'next/link';

const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirmPassword: z.string(),
    company: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      company: '',
    },
  });

  const { register: signup, isLoading } = useAuth();

  const onSubmit = async (data: SignupFormValues) => {
    try {
      await signup(
        data.name,
        data.email,
        data.password,
        data.company
      );
      
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during signup');
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 className="mt-6 text-3xl font-extrabold text-center text-gray-900 dark:text-white">
        Create your account
      </h2>
      <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Sign in
        </Link>
      </p>

      <div className="px-4 py-8 mt-8 bg-white shadow dark:bg-gray-800 sm:rounded-lg sm:px-10">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            id="name"
            label="Full Name"
            {...register('name')}
            error={formState.errors.name}
            autoComplete="name"
            required
          />

          <Input
            id="email"
            type="email"
            label="Email address"
            {...register('email')}
            error={formState.errors.email}
            autoComplete="email"
            required
          />

          <Input
            id="company"
            label="Company (Optional)"
            {...register('company')}
            error={formState.errors.company}
            autoComplete="organization"
          />

          <Input
            id="password"
            type="password"
            label="Password"
            {...register('password')}
            error={formState.errors.password}
            autoComplete="new-password"
            required
          />

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            {...register('confirmPassword')}
            error={formState.errors.confirmPassword}
            autoComplete="new-password"
            required
          />

          <div className="mt-6">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-gray-500 bg-white dark:bg-gray-800">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              leftIcon={
                <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.025A9.564 9.564 0 0110 4.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.16 20 14.416 20 10c0-5.523-4.477-10-10-10z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            >
              GitHub
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              leftIcon={
                <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              }
            >
              Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
