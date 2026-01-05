'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to inbox by default
    router.push('/inbox');
  }, [router]);

  return null;
}
