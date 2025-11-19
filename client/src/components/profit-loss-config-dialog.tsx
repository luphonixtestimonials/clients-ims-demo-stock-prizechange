import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Edit, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const configSchema = z.object({
  type: z.enum(["indirect_expense", "indirect_income"]),
  name: z.string().min(1, "Name is required"),
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, { message: "Amount must be a non-negative number" }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ConfigFormData = z.infer<typeof configSchema>;

interface ProfitLossConfig {
  id: string;
  type: "indirect_expense" | "indirect_income";
  name: string;
  amount: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfitLossConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfitLossConfigDialog({ open, onOpenChange }: ProfitLossConfigDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<"indirect_expense" | "indirect_income">("indirect_expense");

  const { data: configs = [], isLoading } = useQuery<ProfitLossConfig[]>({
    queryKey: ["/api/profit-loss-config"],
  });

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      type: "indirect_expense",
      name: "",
      amount: "0",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (editingId) {
      const config = configs.find((c) => c.id === editingId);
      if (config) {
        form.reset({
          type: config.type,
          name: config.name,
          amount: config.amount,
          description: config.description || "",
          isActive: config.isActive,
        });
      }
    } else {
      form.reset({
        type: currentTab,
        name: "",
        amount: "0",
        description: "",
        isActive: true,
      });
    }
  }, [editingId, configs, form, currentTab]);

  const createMutation = useMutation({
    mutationFn: async (data: ConfigFormData) => {
      const response = await fetch("/api/profit-loss-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create configuration");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profit-loss-config"] });
      toast({
        title: "Configuration created",
        description: "The configuration has been created successfully.",
      });
      form.reset();
      setEditingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ConfigFormData }) => {
      const response = await fetch(`/api/profit-loss-config/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update configuration");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profit-loss-config"] });
      toast({
        title: "Configuration updated",
        description: "The configuration has been updated successfully.",
      });
      form.reset();
      setEditingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/profit-loss-config/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete configuration");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profit-loss-config"] });
      toast({
        title: "Configuration deleted",
        description: "The configuration has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConfigFormData) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (config: ProfitLossConfig) => {
    setEditingId(config.id);
    setCurrentTab(config.type);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this configuration?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    form.reset();
  };

  const expenseConfigs = configs.filter((c) => c.type === "indirect_expense");
  const incomeConfigs = configs.filter((c) => c.type === "indirect_income");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profit & Loss Configuration</DialogTitle>
          <DialogDescription>
            Manage indirect expenses and indirect income for accurate net profit calculation.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as typeof currentTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="indirect_expense">Indirect Expenses</TabsTrigger>
            <TabsTrigger value="indirect_income">Indirect Income</TabsTrigger>
          </TabsList>

          <TabsContent value="indirect_expense" className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Examples of Indirect Expenses:</h4>
              <p className="text-sm text-muted-foreground">
                Fixed Salary, Rent, Office Expenses, Staff Welfare, Depreciation, Interest, etc.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <input type="hidden" {...field} value="indirect_expense" />
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Fixed Salary, Rent" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">Active</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? "Update" : "Add"} Expense
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseConfigs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No indirect expenses configured
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenseConfigs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{config.name}</TableCell>
                        <TableCell>${parseFloat(config.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {config.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.isActive ? "default" : "secondary"}>
                            {config.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(config)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(config.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="indirect_income" className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Examples of Indirect Income:</h4>
              <p className="text-sm text-muted-foreground">
                Dividend, Interest Income, Any Other Income (e.g., Scrap sales), etc.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <input type="hidden" {...field} value="indirect_income" />
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Dividend, Interest" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">Active</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? "Update" : "Add"} Income
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeConfigs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No indirect income configured
                      </TableCell>
                    </TableRow>
                  ) : (
                    incomeConfigs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{config.name}</TableCell>
                        <TableCell>${parseFloat(config.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {config.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.isActive ? "default" : "secondary"}>
                            {config.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(config)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(config.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
