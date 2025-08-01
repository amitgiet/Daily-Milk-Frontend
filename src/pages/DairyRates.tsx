import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useQuery, useMutation } from '../hooks/useApi';
import { apiCall } from '../lib/apiCall';
import { allRoutes } from '../lib/apiRoutes';

interface DairyRates {
  fatRate: number;
  snfRate: number;
  formulaType: 'fatOnly' | 'fatAndSnf';
}

const DairyRates: React.FC = () => {
  const { t } = useTranslation();
  const [fatRate, setFatRate] = useState<string>('');
  const [snfRate, setSnfRate] = useState<string>('');
  const [formulaType, setFormulaType] = useState<'fatOnly' | 'fatAndSnf'>('fatOnly');

  // Fetch current rates
  const { data: ratesData, loading: ratesLoading, execute: fetchRates } = useQuery(
    () => apiCall(allRoutes.dairy.rates, 'get'),
    { autoExecute: true }
  );

  // Update rates mutation
  const { execute: updateRates, loading: updatingRates } = useMutation(
    (data: DairyRates) => apiCall(allRoutes.dairy.updateRates, 'post', data),
    {
      onSuccess: () => {
        fetchRates();
        resetForm();
      }
    }
  );

  const currentRates: DairyRates = ratesData?.data || { fatRate: 0, snfRate: 0, formulaType: 'fatOnly' };

  const resetForm = () => {
    setFatRate('');
    setSnfRate('');
    setFormulaType('fatOnly');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fatRate || !snfRate) {
      return;
    }

    const ratesData: DairyRates = {
      fatRate: parseFloat(fatRate),
      snfRate: parseFloat(snfRate),
      formulaType
    };

    await updateRates(ratesData);
  };

  const calculateMilkRate = (fat: number, snf: number) => {
    if (formulaType === 'fatOnly') {
      return currentRates.fatRate * fat;
    } else {
      return (currentRates.fatRate * fat) + (currentRates.snfRate * snf);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('dairyRates.title')}</h1>
      </div>

      {/* Current Rates Display */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dairyRates.currentRates')}</CardTitle>
        </CardHeader>
        <CardContent>
          {ratesLoading ? (
            <div className="text-center py-4">{t('common.loading')}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">₹{currentRates.fatRate}</div>
                <div className="text-sm text-muted-foreground">{t('dairyRates.fatRate')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₹{currentRates.snfRate}</div>
                <div className="text-sm text-muted-foreground">{t('dairyRates.snfRate')}</div>
              </div>
              <div className="text-center">
                <Badge variant={currentRates.formulaType === 'fatOnly' ? 'default' : 'secondary'}>
                  {t(`dairyRates.${currentRates.formulaType}`)}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">{t('dairyRates.formulaType')}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Rates Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dairyRates.updateRates')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fatRate">{t('dairyRates.fatRate')} (₹)</Label>
                <Input
                  id="fatRate"
                  type="number"
                  step="0.01"
                  value={fatRate}
                  onChange={(e) => setFatRate(e.target.value)}
                  placeholder={currentRates.fatRate.toString()}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="snfRate">{t('dairyRates.snfRate')} (₹)</Label>
                <Input
                  id="snfRate"
                  type="number"
                  step="0.01"
                  value={snfRate}
                  onChange={(e) => setSnfRate(e.target.value)}
                  placeholder={currentRates.snfRate.toString()}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="formulaType">{t('dairyRates.formulaType')}</Label>
                <Select value={formulaType} onValueChange={(value: 'fatOnly' | 'fatAndSnf') => setFormulaType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fatOnly">{t('dairyRates.fatOnly')}</SelectItem>
                    <SelectItem value="fatAndSnf">{t('dairyRates.fatAndSnf')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={updatingRates}>
                {updatingRates ? t('common.loading') : t('dairyRates.updateRates')}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                {t('common.reset')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Rate Calculator */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dairyRates.rateCalculator')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('dairyRates.exampleCalculation')}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t('dairyRates.fat')}: 4.0%</span>
                  <span>SNF: 8.5%</span>
                </div>
                <div className="text-lg font-semibold text-green-600">
                  {t('dairyRates.rate')}: ₹{calculateMilkRate(4.0, 8.5).toFixed(2)}/L
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('dairyRates.formula')}</h3>
              <div className="text-sm text-muted-foreground">
                {formulaType === 'fatOnly' ? (
                  <div>
                    <div>Rate = Fat Rate × Fat %</div>
                    <div className="mt-2">₹{currentRates.fatRate} × 4.0% = ₹{calculateMilkRate(4.0, 8.5).toFixed(2)}</div>
                  </div>
                ) : (
                  <div>
                    <div>Rate = (Fat Rate × Fat %) + (SNF Rate × SNF %)</div>
                    <div className="mt-2">
                      (₹{currentRates.fatRate} × 4.0%) + (₹{currentRates.snfRate} × 8.5%) = ₹{calculateMilkRate(4.0, 8.5).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DairyRates; 