import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Users,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { apiCall } from '@/lib/apiCall';
import { allRoutes } from '@/lib/apiRoutes';
import { toast } from 'react-toastify';
import {
  SubscriptionPlan,
  SubscriptionPlanFormData,
  PendingRequest,
} from '@/types/subscription';
import { usePermissions } from '@/hooks/usePermissions';

export default function AdminSubscriptionPlans() {
  const { t } = useTranslation();
  const { canAccessFeature } = usePermissions();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<SubscriptionPlanFormData>({
    name: '',
    durationDays: 30,
    price: 0,
    features: [],
  });
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    loadPlans();
    loadPendingRequests();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await apiCall(allRoutes.subscriptions.list, 'get');
      if (response.success && response.data) {
        const plansData = Array.isArray(response.data.data) ? response.data.data : [];
        setPlans(plansData);
      } else {
        setPlans([]);
      }
    } catch (error) {
      console.error('Error loading subscription plans:', error);
      toast.error(t('subscriptionPlans.loadPlansError'));
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await apiCall(allRoutes.subscriptions.pendingRequests, 'get');
      if (response.success && response.data) {
        setPendingRequests(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
      toast.error(t('subscriptionPlans.loadRequestsError'));
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price;
    if (!formData.name || formData.durationDays <= 0 || price <= 0) {
      toast.error(t('subscriptionPlans.fillRequiredFields'));
      return;
    }

    try {
      if (editingPlan) {
        // Update existing plan
        const response = await apiCall(
          allRoutes.subscriptions.update(editingPlan.id),
          'put',
          formData
        );
        if (response.success) {
          toast.success(t('subscriptionPlans.planUpdated'));
          setShowForm(false);
          setEditingPlan(null);
          resetForm();
          loadPlans();
        }
      } else {
        // Create new plan
        const response = await apiCall(
          allRoutes.subscriptions.add,
          'post',
          formData
        );
        if (response.success) {
          toast.success(t('subscriptionPlans.planCreated'));
          setShowForm(false);
          resetForm();
          loadPlans();
        }
      }
    } catch (error) {
      console.error('Error saving subscription plan:', error);
      toast.error(t('subscriptionPlans.savePlanError'));
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      durationDays: plan.durationDays,
      price: typeof plan.price === 'string' ? parseFloat(plan.price) || 0 : plan.price,
      features: plan.features || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (planId: number) => {
    try {
      const response = await apiCall(
        allRoutes.subscriptions.delete(planId),
        'delete'
      );
      if (response.success) {
        toast.success(t('subscriptionPlans.planDeleted'));
        loadPlans();
      }
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      toast.error(t('subscriptionPlans.deletePlanError'));
    }
  };

  const handleToggleStatus = async (planId: number, currentStatus: boolean) => {
    try {
      const response = await apiCall(
        allRoutes.subscriptions.toggleStatus(planId),
        'patch'
      );
      if (response.success) {
        toast.success(
          currentStatus ? t('subscriptionPlans.planDeactivated') : t('subscriptionPlans.planActivated')
        );
        loadPlans();
      }
    } catch (error) {
      console.error('Error toggling plan status:', error);
      toast.error(t('subscriptionPlans.toggleStatusError'));
    }
  };

  const handleUpdateRequestStatus = async (
    requestId: number,
    status: 'active' | 'cancelled'
  ) => {
    try {
      const response = await apiCall(
        allRoutes.subscriptions.updateRequestStatus(requestId),
        'put',
        { status }
      );
      if (response.success) {
        toast.success(status === 'active' ? t('subscriptionPlans.requestApproved') : t('subscriptionPlans.requestRejected'));
        loadPendingRequests();
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error(t('subscriptionPlans.updateRequestError'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      durationDays: 30,
      price: 0,
      features: [],
    });
    setNewFeature('');
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('subscriptionPlans.title')}</h1>
          <p className="text-muted-foreground">
            {t('subscriptionPlans.subtitle')}
          </p>
        </div>
        {canAccessFeature('manageSubscriptionPlans') && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('subscriptionPlans.addPlan')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? t('subscriptionPlans.editPlan') : t('subscriptionPlans.createPlan')}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">{t('subscriptionPlans.planName')}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={t('subscriptionPlans.planNamePlaceholder')}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="durationDays">{t('subscriptionPlans.durationDays')}</Label>
                    <Input
                      id="durationDays"
                      type="number"
                      value={formData.durationDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          durationDays: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder={t('subscriptionPlans.durationDaysPlaceholder')}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="price">{t('subscriptionPlans.price')}</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder={t('subscriptionPlans.pricePlaceholder')}
                    required
                  />
                </div>
                <div>
                  <Label>{t('subscriptionPlans.features')}</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder={t('subscriptionPlans.addFeature')}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" onClick={addFeature} variant="outline">
                      {t('subscriptionPlans.add')}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="flex-1 text-sm">{feature}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeature(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPlan(null);
                      resetForm();
                    }}
                  >
                    {t('subscriptionPlans.cancel')}
                  </Button>
                  <Button type="submit">
                    {editingPlan ? t('subscriptionPlans.updatePlan') : t('subscriptionPlans.createPlanButton')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t('subscriptionPlans.subscriptionPlans')}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('subscriptionPlans.pendingRequests')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>{t('subscriptionPlans.subscriptionPlans')}</CardTitle>
              <CardDescription>
                {t('subscriptionPlans.managePlans')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">{t('subscriptionPlans.loadingPlans')}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <Card key={plan.id} className="relative">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <CardDescription>
                              {plan.durationDays} days • ₹{typeof plan.price === 'string' ? plan.price : plan.price.toString()}
                            </CardDescription>
                          </div>
                          <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                            {plan.isActive ? t('subscriptionPlans.active') : t('subscriptionPlans.inactive')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {plan.durationDays} days
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            
                            ₹{typeof plan.price === 'string' ? plan.price : plan.price.toString()}
                          </div>
                          {plan.features && plan.features.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Features:</p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {plan.features.map((feature, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                              {canAccessFeature('manageSubscriptionPlans') && (
                                <Switch
                                  checked={plan.isActive}
                                  onCheckedChange={() => handleToggleStatus(plan.id, plan.isActive)}
                                />
                              )}
                              <span className="text-xs text-muted-foreground">
                                {plan.isActive ? t('subscriptionPlans.active') : t('subscriptionPlans.inactive')}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              {canAccessFeature('manageSubscriptionPlans') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(plan)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                                {canAccessFeature('manageSubscriptionPlans') && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{plan.name}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(plan.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>{t('subscriptionPlans.pendingRequests')}</CardTitle>
              <CardDescription>
                {t('subscriptionPlans.reviewRequests')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="text-center py-8">{t('subscriptionPlans.loadingRequests')}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('subscriptionPlans.dairy')}</TableHead>
                      <TableHead>{t('subscriptionPlans.plan')}</TableHead>
                      <TableHead>{t('subscriptionPlans.requestDate')}</TableHead>
                      <TableHead>{t('subscriptionPlans.status')}</TableHead>
                      <TableHead>{t('subscriptionPlans.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          {t('subscriptionPlans.noPendingRequests')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.dairy.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Email: {request.dairy.email}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Phone: {request.dairy.phone}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Dairy ID: {request.dairy.id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.plan.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Price: ₹{request.plan.price}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Duration: {request.plan.durationDays} days
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Plan ID: {request.plan.id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatDate(request.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                request.status === 'pending'
                                  ? 'secondary'
                                  : request.status === 'approved'
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateRequestStatus(request.id, 'active')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  {t('subscriptionPlans.approve')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleUpdateRequestStatus(request.id, 'cancelled')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  {t('subscriptionPlans.reject')}
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 