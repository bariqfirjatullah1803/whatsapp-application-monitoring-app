import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
  type PaginationState,
  flexRender,
} from '@tanstack/react-table';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { UserWithRole, UserRole, RegisterCredentials, PaginationInfo } from '@/lib/types';
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
import { Plus, Edit, Loader2, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = useState('');
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  const [searchDebounce, setSearchDebounce] = useState('');

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

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get current sorting
      const sortBy = sorting[0]?.id || 'createdAt';
      const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';

      // Get current page (pageIndex is 0-based, backend uses 1-based)
      const page = pagination.pageIndex + 1;
      const pageSize = pagination.pageSize;

      const response = await api.getUsers({
        page,
        pageSize,
        sortBy,
        sortOrder,
        search: searchDebounce || undefined,
      });

      setUsers(response.users);
      setPaginationInfo(response.pagination);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Gagal memuat daftar user');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search untuk mengurangi request
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchDebounce(globalFilter);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [globalFilter]);

  // Effect untuk load users saat pagination, sorting, atau search berubah
  useEffect(() => {
    if (!canManageUsers) return;
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageUsers, pagination.pageIndex, pagination.pageSize, sorting, searchDebounce]);

  // Reset ke page 1 saat search berubah
  useEffect(() => {
    if (globalFilter !== searchDebounce) return; // Tunggu sampai debounce selesai
    setPagination((prev) => {
      if (prev.pageIndex !== 0) {
        return { ...prev, pageIndex: 0 };
      }
      return prev;
    });
  }, [globalFilter, searchDebounce]);

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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setCreateError(error.response?.data?.error || 'Gagal membuat user');
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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setUpdateError(error.response?.data?.error || 'Gagal mengupdate role');
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

  // Kolom definisi untuk datatable
  const columns = useMemo<ColumnDef<UserWithRole>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Nama
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
      },
      {
        accessorKey: 'email',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Email
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => <div>{row.getValue('email')}</div>,
      },
      {
        accessorKey: 'role',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Role
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const role = row.getValue('role') as UserRole;
          return (
            <Badge variant="outline" className={roleColors[role]}>
              {roleLabels[role]}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Tanggal Dibuat
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = row.getValue('createdAt') as string;
          return date ? format(new Date(date), 'dd MMM yyyy, HH:mm') : '-';
        },
      },
      ...(isAdmin
        ? [
            {
              id: 'actions',
              header: () => <div className="text-right">Aksi</div>,
              cell: ({ row }: { row: { original: UserWithRole } }) => {
                const user = row.original;
                return (
                  <div className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                );
              },
            },
          ]
        : []),
    ],
    [isAdmin]
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: paginationInfo ? paginationInfo.totalPages : 0,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  // Hanya admin dan leader yang bisa akses
  if (!canManageUsers) {
    return null;
  }

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

        {/* Search Input */}
        <div className="mb-4">
          <Input
            placeholder="Cari user (nama, email, role)..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        Tidak ada user ditemukan.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {paginationInfo && (
              <div className="flex items-center justify-between px-2">
                <div className="flex-1 text-sm text-muted-foreground">
                  Menampilkan {((paginationInfo.page - 1) * paginationInfo.pageSize) + 1} sampai{' '}
                  {Math.min(
                    paginationInfo.page * paginationInfo.pageSize,
                    paginationInfo.total
                  )}{' '}
                  dari {paginationInfo.total} user
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!paginationInfo.hasPreviousPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Halaman {paginationInfo.page} dari {paginationInfo.totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!paginationInfo.hasNextPage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
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


