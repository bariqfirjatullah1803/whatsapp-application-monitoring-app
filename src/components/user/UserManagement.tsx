import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { UserWithRole, UserRole, RegisterCredentials } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  leader: 'Leader',
  customer_service: 'Customer Service',
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-500/10 text-red-600 border-red-500/20',
  leader: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  customer_service: 'bg-green-500/10 text-green-600 border-green-500/20',
};

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  // Form state untuk create
  const [createForm, setCreateForm] = useState<RegisterCredentials>({
    name: '',
    email: '',
    password: '',
    role: 'customer_service',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string>('');

  // Form state untuk edit role
  const [editRole, setEditRole] = useState<UserRole>('customer_service');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string>('');

  const isAdmin = currentUser?.role === 'admin';
  const isLeader = currentUser?.role === 'leader';
  const canManageUsers = isAdmin || isLeader;

  // Hanya admin dan leader yang bisa akses
  if (!canManageUsers) {
    return null;
  }

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.getUsers();
      setUsers(response.users);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal memuat daftar user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    // Validasi: Leader hanya bisa create customer_service
    if (currentUser?.role === 'leader' && createForm.role !== 'customer_service') {
      setCreateError('Leader hanya bisa mendaftarkan customer_service');
      return;
    }

    try {
      setIsCreating(true);
      await api.registerUser(createForm);
      setIsCreateDialogOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'customer_service' });
      await loadUsers();
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Gagal membuat user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    setUpdateError('');
    try {
      setIsUpdating(true);
      await api.updateUserRole(selectedUser.id, { role: editRole });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (err: any) {
      setUpdateError(err.response?.data?.error || 'Gagal mengupdate role');
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setUpdateError('');
    setIsEditDialogOpen(true);
  };

  const availableRoles = useMemo(() => {
    if (isAdmin) {
      return ['admin', 'leader', 'customer_service'] as UserRole[];
    }
    // Leader hanya bisa create customer_service
    return ['customer_service'] as UserRole[];
  }, [isAdmin]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Manajemen User</CardTitle>
            <CardDescription>
              Kelola user dan role. {isAdmin ? 'Admin dapat mengelola semua role.' : 'Leader hanya dapat membuat customer_service.'}
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateUser}>
                <DialogHeader>
                  <DialogTitle>Tambah User Baru</DialogTitle>
                  <DialogDescription>
                    Buat akun user baru. Password akan di-hash secara otomatis.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {createError && (
                    <Alert variant="destructive">
                      <AlertDescription>{createError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nama</Label>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={createForm.role}
                      onValueChange={(value) => setCreateForm({ ...createForm, role: value as UserRole })}
                    >
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {roleLabels[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Buat User
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="h-24 text-center">
                      Tidak ada user
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.createdAt
                          ? format(new Date(user.createdAt), 'dd MMM yyyy, HH:mm')
                          : '-'}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ubah Role User</DialogTitle>
              <DialogDescription>
                Ubah role untuk {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {updateError && (
                <Alert variant="destructive">
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editRole} onValueChange={(value) => setEditRole(value as UserRole)}>
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['admin', 'leader', 'customer_service'] as UserRole[]).map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Batal
              </Button>
              <Button onClick={handleUpdateRole} disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}


