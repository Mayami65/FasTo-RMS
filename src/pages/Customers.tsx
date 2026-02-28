import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer } from '@/types/customer';
import { CustomerList } from '@/features/customers/CustomerList';
import { CustomerForm } from '@/features/customers/CustomerForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Customers() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

    // Pagination state
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });

    useEffect(() => {
        loadCustomers();
    }, [page, search]);

    useEffect(() => {
        // Reset to page 1 when search changes
        if (page !== 1) {
            setPage(1);
        }
    }, [search]);

    const loadCustomers = async () => {
        try {
            const response = await window.api.getCustomers({ page, limit: 10, search });
            if (response && 'data' in response) {
                setCustomers(response.data);
                setPagination(response.pagination);
            } else {
                // Fallback for non-paginated response
                setCustomers((response as any) || []);
            }
        } catch (error) {
            console.error("Failed to load customers", error);
        }
    };

    const handleAddCustomer = () => {
        setEditingCustomer(undefined);
        setIsDialogOpen(true);
    };

    const handleEditCustomer = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsDialogOpen(true);
    };

    const handleViewDetails = (customer: Customer) => {
        navigate(`/customers/${customer.id}`);
    };

    const handleSubmit = async (data: any) => {
        try {
            if (editingCustomer) {
                await window.api.updateCustomer({ ...data, id: editingCustomer.id });
            } else {
                await window.api.addCustomer(data);
            }
            setIsDialogOpen(false);
            loadCustomers();
        } catch (error) {
            console.error("Failed to save customer", error);
            alert("Failed to save customer");
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground">Manage customer details for Hire Purchase.</p>
                </div>
                <Button onClick={handleAddCustomer}>
                    <Plus className="mr-2 h-4 w-4" /> Add Customer
                </Button>
            </div>

            <CustomerList
                customers={customers}
                search={search}
                onSearchChange={setSearch}
                pagination={pagination}
                onPageChange={setPage}
                onEdit={handleEditCustomer}
                onViewDetails={handleViewDetails}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                    </DialogHeader>
                    <CustomerForm
                        onSubmit={handleSubmit}
                        initialData={editingCustomer}
                        onCancel={() => setIsDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
