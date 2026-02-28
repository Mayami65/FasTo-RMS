import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Customer } from '@/types/customer';

const customerSchema = z.object({
    name: z.string().min(2, "Name is required"),
    phone: z.string().min(10, "Phone number is required"),
    email: z.string().email().optional().or(z.literal('')),
    id_card_number: z.string().optional(),
    address: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
    onSubmit: (data: CustomerFormData) => void;
    initialData?: Customer;
    onCancel: () => void;
}

export function CustomerForm({ onSubmit, initialData, onCancel }: CustomerFormProps) {
    const form = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
        defaultValues: initialData || {
            name: '',
            phone: '',
            email: '',
            id_card_number: '',
            address: '',
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="020xxxxxxx" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="id_card_number"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ID Card (Ghana Card)</FormLabel>
                                <FormControl>
                                    <Input placeholder="GHA-xxxxxxxx" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address / Landmark</FormLabel>
                            <FormControl>
                                <Input placeholder="Near the market..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {initialData ? 'Update Customer' : 'Add Customer'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
