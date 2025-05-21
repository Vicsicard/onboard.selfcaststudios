import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the onboarding page
    router.push('/onboarding');
  }, [router]);

  // Return a loading state while redirecting
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Redirecting to onboarding form...</p>
    </div>
  );
}
