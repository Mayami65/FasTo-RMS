import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Eye, Search } from 'lucide-react';
import { Customer } from '@/types/customer';

interface CustomerListProps {
    customers: Customer[];
    search: string;
    onSearchChange: (search: string) => void;
    pagination: {
        page: number;
        total: number;
        totalPages: number;
        limit: number;
    };
    onPageChange: (page: number) => void;
    onEdit: (customer: Customer) => void;
    onViewDetails: (customer: Customer) => void;
}

export function CustomerList({
    customers,
    search,
    onSearchChange,
    pagination,
    onPageChange,
    onEdit,
    onViewDetails
}: CustomerListProps) {
    const { page, total, totalPages, limit } = pagination;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or phone..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="text-sm text-muted-foreground">
                    Showing {customers.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} customers
                </div>
            </div>

            {customers.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">No customers found. Add one to get started.</div>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>ID Card</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">{customer.name}</TableCell>
                                    <TableCell>{customer.phone}</TableCell>
                                    <TableCell>{customer.id_card_number || '-'}</TableCell>
                                    <TableCell>{customer.address || '-'}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => onViewDetails(customer)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(customer)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination Controls */}
            {customers.length > 0 && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground">
                        Page {page} of {totalPages || 1}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(Math.max(1, page - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                            disabled={page >= totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
