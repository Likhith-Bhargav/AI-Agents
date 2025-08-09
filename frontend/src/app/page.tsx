'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page when the component mounts
    router.push('/login');
  }, [router]);

  // Show a loading message while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-medium">Redirecting to login...</h1>
      </div>
    </div>
  );
}
