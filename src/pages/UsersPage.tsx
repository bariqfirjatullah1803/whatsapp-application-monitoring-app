import { UserManagement } from '@/components/user/UserManagement';
import { useAuth } from '@/context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isLeader = user?.role === 'leader';

  // Hanya admin dan leader yang bisa akses
  if (!isAdmin && !isLeader) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>
      <UserManagement />
    </div>
  );
}

