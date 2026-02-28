import React, { useEffect, useState } from 'react';
import {
    History,
    Search,
    User,
    Calendar,
    AlertCircle,
    ShieldAlert,
    Lock
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogDetailsFormatter } from '@/components/LogDetailsFormatter';
import { useFeatures } from '@/hooks/useFeatures';
import { useNavigate } from 'react-router-dom';

const AuditLogs: React.FC = () => {
    const { hasAuditLogs } = useFeatures();
    const navigate = useNavigate();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await window.api.getAuditLogs({ limit: 100 });
            setLogs(response.logs || []);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details || '').toLowerCase().includes(searchTerm.toLowerCase())
    );



    const getActionBadge = (action: string) => {
        if (action.includes('DELETE')) {
            return <Badge variant="destructive">{action}</Badge>;
        }
        if (action.includes('UPDATE')) {
            return <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-500">{action}</Badge>;
        }
        return <Badge variant="secondary">{action}</Badge>;
    };

    if (!hasAuditLogs) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="h-24 w-24 bg-slate-100 rounded-3xl flex items-center justify-center shadow-inner">
                    <Lock className="h-12 w-12 text-slate-400" />
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-3xl font-black text-slate-900">Security Logs Private</h2>
                    <p className="text-slate-500 font-medium">System audit trails are reserved for <span className="text-primary font-black">PRO Edition</span> users to ensure maximum security compliance.</p>
                </div>
                <Button
                    onClick={() => navigate('/settings')}
                    className="font-black px-8 py-6 text-lg rounded-2xl shadow-xl shadow-primary/20"
                >
                    Upgrade Plan
                </Button>
            </div>
        );
    }
    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Audit</h1>
                    <p className="text-muted-foreground mt-1">Track comprehensive system activities and security events</p>
                </div>
                <Button variant="outline" onClick={fetchLogs} className="gap-2">
                    <History className="w-4 h-4" />
                    Refresh Logs
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-primary" />
                                Audit Log Entries
                            </CardTitle>
                            <CardDescription>
                                Showing the last 100 system events
                            </CardDescription>
                        </div>
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Timestamp</TableHead>
                                    <TableHead className="w-[150px]">User</TableHead>
                                    <TableHead className="w-[150px]">Action</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Loading logs...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertCircle className="w-6 h-6" />
                                                No logs found.
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-medium">{log.username || `User ${log.user_id}`}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getActionBadge(log.action)}
                                            </TableCell>
                                            <TableCell>
                                                <LogDetailsFormatter action={log.action} details={log.details} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
};

export default AuditLogs;
