import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { useQuery, useMutation } from '../hooks/useApi';
import { apiCall } from '../lib/apiCall';
import { allRoutes } from '../lib/apiRoutes';

interface MilkEntry {
  id: number;
  farmerId: number;
  farmerName: string;
  date: string;
  shift: 'morning' | 'evening';
  quantity: number;
  fat: number;
  snf: number;
  rate: number;
  totalAmount: number;
  createdAt: string;
}

interface Farmer {
  id: number;
  name: string;
  phone: string;
}

const MilkCollection: React.FC = () => {
  const { t } = useTranslation();
  const [selectedFarmer, setSelectedFarmer] = useState<string>('');
  const [fat, setFat] = useState<string>('');
  const [snf, setSnf] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [shift, setShift] = useState<'morning' | 'evening'>('morning');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MilkEntry | null>(null);

  // Fetch farmers list
  const { data: farmersData, loading: farmersLoading, execute: fetchFarmers } = useQuery(
    () => apiCall(allRoutes.farmers.list, 'get'),
    { autoExecute: true }
  );

  // Fetch milk collection list
  const { data: milkData, loading: milkLoading, execute: fetchMilk } = useQuery(
    () => apiCall(allRoutes.milkCollection.list, 'get'),
    { autoExecute: true }
  );

  // Collect milk mutation
  const { execute: collectMilk, loading: collectingMilk } = useMutation(
    (data: Record<string, unknown>) => apiCall(allRoutes.milkCollection.collect, 'post', data),
    {
      onSuccess: () => {
        fetchMilk();
        resetForm();
      }
    }
  );

  // Update milk entry mutation
  const { execute: updateMilk, loading: updatingMilk } = useMutation(
    (data: { id: number; updateData: Record<string, unknown> }) => apiCall(allRoutes.milkCollection.update(data.id), 'put', data.updateData),
    {
      onSuccess: () => {
        fetchMilk();
        resetForm();
        setIsEditMode(false);
        setEditingEntry(null);
      }
    }
  );

  const farmers: Farmer[] = farmersData?.data || [];
  const milkEntries: MilkEntry[] = milkData?.data || [];

  const resetForm = () => {
    setSelectedFarmer('');
    setFat('');
    setSnf('');
    setQuantity('');
    setShift('morning');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const calculateRate = (fatValue: number, snfValue: number) => {
    // Simple rate calculation based on fat and SNF
    // This can be customized based on your business logic
    const baseRate = 50; // Base rate per liter
    const fatRate = fatValue * 2; // ₹2 per fat percentage
    const snfRate = snfValue * 1; // ₹1 per SNF percentage
    return baseRate + fatRate + snfRate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFarmer || !fat || !snf || !quantity) {
      return;
    }

    const rate = calculateRate(parseFloat(fat), parseFloat(snf));
    const totalAmount = rate * parseFloat(quantity);

    const milkData = {
      farmerId: parseInt(selectedFarmer),
      date,
      shift,
      quantity: parseFloat(quantity),
      fat: parseFloat(fat),
      snf: parseFloat(snf)
    };

    if (isEditMode && editingEntry) {
      await updateMilk({ id: editingEntry.id, updateData: milkData });
    } else {
      await collectMilk(milkData);
    }
  };

  const handleEdit = (entry: MilkEntry) => {
    setIsEditMode(true);
    setEditingEntry(entry);
    setSelectedFarmer(entry.farmerId.toString());
    setFat(entry.fat.toString());
    setSnf(entry.snf.toString());
    setQuantity(entry.quantity.toString());
    setShift(entry.shift);
    setDate(entry.date);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingEntry(null);
    resetForm();
  };

  // Calculate summary
  const totalLiters = milkEntries.reduce((sum, entry) => sum + entry.quantity, 0);
  const totalAmount = milkEntries.reduce((sum, entry) => sum + entry.totalAmount, 0);
  const totalFarmers = new Set(milkEntries.map(entry => entry.farmerId)).size;
  const averageFat = milkEntries.length > 0 
    ? milkEntries.reduce((sum, entry) => sum + entry.fat, 0) / milkEntries.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('milkCollection.title')}</h1>
      </div>

      {/* Milk Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? t('milkCollection.editEntry') : t('milkCollection.addEntry')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="farmer">{t('milkCollection.farmerName')}</Label>
                <Select value={selectedFarmer} onValueChange={setSelectedFarmer} disabled={farmersLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('milkCollection.selectFarmer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {farmers.map((farmer) => (
                      <SelectItem key={farmer.id} value={farmer.id.toString()}>
                        {farmer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">{t('milkCollection.date')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift">{t('milkCollection.shift')}</Label>
                <Select value={shift} onValueChange={(value: 'morning' | 'evening') => setShift(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">{t('milkCollection.morning')}</SelectItem>
                    <SelectItem value="evening">{t('milkCollection.evening')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fat">{t('milkCollection.fat')} (%)</Label>
                <Input
                  id="fat"
                  type="number"
                  step="0.1"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="3.8"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="snf">{t('milkCollection.snf')} (%)</Label>
                <Input
                  id="snf"
                  type="number"
                  step="0.1"
                  value={snf}
                  onChange={(e) => setSnf(e.target.value)}
                  placeholder="8.5"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">{t('milkCollection.quantity')} (L)</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="5.5"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={collectingMilk || updatingMilk}>
                {collectingMilk || updatingMilk ? t('common.loading') : (isEditMode ? t('common.update') : t('common.submit'))}
              </Button>
              {isEditMode && (
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  {t('common.cancel')}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalLiters.toFixed(1)} L</div>
            <div className="text-sm text-muted-foreground">{t('milkCollection.totalLiters')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">{t('milkCollection.totalAmount')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalFarmers}</div>
            <div className="text-sm text-muted-foreground">{t('milkCollection.totalFarmers')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{averageFat.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">{t('milkCollection.averageFat')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Milk Collection List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('milkCollection.dailyList')}</CardTitle>
        </CardHeader>
        <CardContent>
          {milkLoading ? (
            <div className="text-center py-4">{t('common.loading')}</div>
          ) : milkEntries.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">{t('milkCollection.noEntries')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('milkCollection.farmerName')}</TableHead>
                  <TableHead>{t('milkCollection.date')}</TableHead>
                  <TableHead>{t('milkCollection.shift')}</TableHead>
                  <TableHead>{t('milkCollection.fat')} (%)</TableHead>
                  <TableHead>{t('milkCollection.snf')} (%)</TableHead>
                  <TableHead>{t('milkCollection.quantity')} (L)</TableHead>
                  <TableHead>{t('milkCollection.rate')} (₹/L)</TableHead>
                  <TableHead>{t('milkCollection.totalAmount')} (₹)</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milkEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.farmerName}</TableCell>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={entry.shift === 'morning' ? 'default' : 'secondary'}>
                        {t(`milkCollection.${entry.shift}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.fat}%</TableCell>
                    <TableCell>{entry.snf}%</TableCell>
                    <TableCell>{entry.quantity} L</TableCell>
                    <TableCell>₹{entry.rate}</TableCell>
                    <TableCell>₹{entry.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                        disabled={isEditMode}
                      >
                        {t('common.edit')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MilkCollection;
