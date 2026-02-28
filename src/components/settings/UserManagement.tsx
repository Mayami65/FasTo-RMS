import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Users, Plus, Trash2, KeyRound, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { user: currentUser } = useAuth();

    // Add User State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'SHOP_REP' });
    const [addError, setAddError] = useState('');

    // Reset Password State
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetUserId, setResetUserId] = useState<number | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetError, setResetError] = useState('');


    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await window.api.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddLoading(true);
        setAddError('');
        try {
            const result = await window.api.createUser(newUser);
            if (result.success) {
                setIsAddOpen(false);
                setNewUser({ username: '', password: '', role: 'SHOP_REP' });
                loadUsers();
            } else {
                setAddError(result.error || 'Failed to create user');
            }
        } catch (error: any) {
            setAddError(error.message);
        } finally {
            setAddLoading(false);
        }
    };

    const handleDeleteUser = async (id: number, username: string) => {
        if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;

        try {
            const result = await window.api.deleteUser(id);
            if (result.success) {
                loadUsers();
            } else {
                alert('Failed to delete user: ' + result.error);
            }
        } catch (error: any) {
            alert('Error deleting user: ' + error.message);
        }
    };

    const openResetPassword = (id: number) => {
        setResetUserId(id);
        setNewPassword('');
        setResetError('');
        setIsResetOpen(true);
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetUserId) return;

        setResetLoading(true);
        setResetError('');
        try {
            const result = await window.api.resetUserPassword({ id: resetUserId, newPassword });
            if (result.success) {
                setIsResetOpen(false);
                alert('Password reset successfully');
            } else {
                setResetError(result.error || 'Failed to reset password');
            }
        } catch (error: any) {
            setResetError(error.message);
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Management
                    </CardTitle>
                    <CardDescription>Manage system users and their roles.</CardDescription>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>Create a new account for a staff member.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            {addError && <div className="text-red-500 text-sm">{addError}</div>}
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={newUser.role}
                                    onValueChange={(val) => setNewUser({ ...newUser, role: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SHOP_REP">Shop Representative</SelectItem>
                                        <SelectItem value="OWNER">Owner (Admin)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={addLoading}>
                                    {addLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create User
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium">{u.username}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'OWNER'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                            }`}>
                                            {u.role === 'OWNER' ? 'Owner' : 'Shop Rep'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openResetPassword(u.id)}
                                            title="Reset Password"
                                        >
                                            <KeyRound className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteUser(u.id, u.username)}
                                            disabled={currentUser?.id === u.id} // Prevent deleting self
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                            title="Delete User"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}

                {/* Reset Password Dialog */}
                <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>Set a new password for this user.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {resetError && <div className="text-red-500 text-sm">{resetError}</div>}
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={resetLoading}>
                                    {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Reset Password
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
