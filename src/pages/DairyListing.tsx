import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { apiCall } from '../lib/apiCall';
import { useQuery } from '../hooks/useApi';

// Types for Dairy and Farmer
interface Dairy {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

interface Farmer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dairyId: number;
  isActive?: boolean;
  currentMonthMilkAmount?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DairyListing: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dairies');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // Fetch dairies
  const { 
    data: dairiesData, 
    loading: dairiesLoading, 
    execute: fetchDairies 
  } = useQuery(
    () => apiCall(`/admin/get-dairies?page=${currentPage}&limit=${limit}&search=${searchTerm}`, 'get'),
    { autoExecute: false }
  );

  // Fetch farmers
  const { 
    data: farmersData, 
    loading: farmersLoading, 
    execute: fetchFarmers 
  } = useQuery(
    () => apiCall(`/admin/get-farmers?page=${currentPage}&limit=${limit}&search=${searchTerm}`, 'get'),
    { autoExecute: false }
  );

  const dairies: Dairy[] = dairiesData?.data?.data || [];
  const farmers: Farmer[] = farmersData?.data?.data || [];
  const dairiesTotal = dairiesData?.data?.total || 0;
  const farmersTotal = farmersData?.data?.total || 0;

  useEffect(() => {
    if (activeTab === 'dairies') {
      fetchDairies();
    } else {
      fetchFarmers();
    }
  }, [activeTab, currentPage, searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = activeTab === 'dairies' 
    ? Math.ceil(dairiesTotal / limit)
    : Math.ceil(farmersTotal / limit);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatMilkAmount = (amount?: string) => {
    if (!amount) return '0.00 L';
    const numAmount = parseFloat(amount);
    return `${numAmount.toFixed(2)} L`;
  };

  const getStatusBadge = (status?: string | boolean) => {
    const isActive = typeof status === 'boolean' ? status : status === 'active';
    if (isActive) {
      return <Badge variant="default" className="bg-green-100 text-green-800">{t('dairyListing.active')}</Badge>;
    }
    return <Badge variant="secondary" className="bg-gray-100 text-gray-800">{t('dairyListing.inactive')}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {activeTab === 'dairies' ? t('dairyListing.title') : t('dairyListing.farmerManagement')}
        </h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {activeTab === 'dairies' ? t('dairyListing.addDairy') : t('dairyListing.addFarmer')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dairyListing.listing')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dairies">{t('dairyListing.dairyListing')}</TabsTrigger>
              <TabsTrigger value="farmers">{t('dairyListing.farmerListing')}</TabsTrigger>
            </TabsList>

            <TabsContent value="dairies" className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('dairyListing.searchDairies')}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {dairiesLoading ? (
                <div className="text-center py-8">{t('dairyListing.loadingDairies')}</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('dairyListing.id')}</TableHead>
                        <TableHead>{t('dairyListing.name')}</TableHead>
                        <TableHead>{t('dairyListing.email')}</TableHead>
                        <TableHead>{t('dairyListing.phone')}</TableHead>
                        <TableHead>{t('dairyListing.createdAt')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dairies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            {t('dairyListing.noDairiesFound')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        dairies.map((dairy) => (
                          <TableRow key={dairy.id}>
                            <TableCell>{dairy.id}</TableCell>
                            <TableCell className="font-medium">{dairy.name}</TableCell>
                            <TableCell>{dairy.email}</TableCell>
                            <TableCell>{dairy.phone}</TableCell>
                            <TableCell>{formatDate(dairy.createdAt)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {t('dairyListing.showing')} {((currentPage - 1) * limit) + 1} {t('dairyListing.to')} {Math.min(currentPage * limit, dairiesTotal)} {t('dairyListing.of')} {dairiesTotal} {t('dairyListing.dairies')}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          {t('dairyListing.previous')}
                        </Button>
                        <span className="text-sm">
                          {t('dairyListing.page')} {currentPage} {t('dairyListing.of')} {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          {t('dairyListing.next')}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="farmers" className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('dairyListing.searchFarmers')}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {farmersLoading ? (
                <div className="text-center py-8">{t('dairyListing.loadingFarmers')}</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('dairyListing.id')}</TableHead>
                        <TableHead>{t('dairyListing.name')}</TableHead>
                        <TableHead>{t('dairyListing.phone')}</TableHead>
                        <TableHead>{t('dairyListing.email')}</TableHead>
                        <TableHead>{t('dairyListing.dairyId')}</TableHead>
                        <TableHead>{t('dairyListing.status')}</TableHead>
                        <TableHead>{t('dairyListing.currentMonthMilk')}</TableHead>
                        <TableHead>{t('dairyListing.createdAt')}</TableHead>
                        <TableHead>{t('dairyListing.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {farmers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            {t('dairyListing.noFarmersFound')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        farmers.map((farmer) => (
                          <TableRow key={farmer.id}>
                            <TableCell>{farmer.id}</TableCell>
                            <TableCell className="font-medium">{farmer.name}</TableCell>
                            <TableCell>{farmer.phone}</TableCell>
                            <TableCell>{farmer.email || '-'}</TableCell>
                            <TableCell>{farmer.dairyId}</TableCell>
                            <TableCell>{getStatusBadge(farmer.isActive)}</TableCell>
                            <TableCell className="font-medium">
                              {formatMilkAmount(farmer.currentMonthMilkAmount)}
                            </TableCell>
                            <TableCell>{formatDate(farmer.createdAt)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm" title={t('dairyListing.view')}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title={t('dairyListing.edit')}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title={t('dairyListing.delete')}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {t('dairyListing.showing')} {((currentPage - 1) * limit) + 1} {t('dairyListing.to')} {Math.min(currentPage * limit, farmersTotal)} {t('dairyListing.of')} {farmersTotal} {t('dairyListing.farmers')}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          {t('dairyListing.previous')}
                        </Button>
                        <span className="text-sm">
                          {t('dairyListing.page')} {currentPage} {t('dairyListing.of')} {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          {t('dairyListing.next')}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DairyListing; 