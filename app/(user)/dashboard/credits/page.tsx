import { redirect } from 'next/navigation';

export default function CreditsRedirectPage() {
  redirect('/dashboard/topup');
}
