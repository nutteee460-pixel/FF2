import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAdminGuard() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/admin-session')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.user || data.user.role !== 'ADMIN') {
          router.push('/admin-login');
        }
      })
      .catch(() => {
        if (!cancelled) router.push('/admin-login');
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);
}
