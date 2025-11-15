import { Link } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">WhatsApp Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage your WhatsApp messages
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}

