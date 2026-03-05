import { UserProfile } from '@clerk/nextjs';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Configurações</h1>
      <UserProfile />
    </div>
  );
}
