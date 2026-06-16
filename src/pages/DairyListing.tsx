import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, Plus } from 'lucide-react';
import { apiCall } from '../lib/apiCall';
import { formatDisplayDate } from "../lib/dateFormat";

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

const DairyListing: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  const { 
    data: dairiesData, 
    loading: dairiesLoading, 
    execute: fetchDairies 
  } = useQuery(
    () => apiCall(`/admin/get-dairies?page=${currentPage}&limit=${limit}&search=${searchTerm}`, 'get'),
    { autoExecute: false }
  );

  const dairies: Dairy[] = dairiesData?.data?.data || [];
  const dairiesTotal = dairiesData?.data?.total || 0;

  useEffect(() => {
    fetchDairies();
  }, [currentPage, searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(dairiesTotal / limit);

  const formatDate = (dateString?: string) => formatDisplayDate(dateString);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            {t('dairyListing.title')}
          </h1>
          <p className="text-muted-foreground">
            Manage and view all registered dairies
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('dairyListing.addDairy')}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('dairyListing.dairyListing', 'Dairy Listing')}</CardTitle>
          <CardDescription>
            List of all dairies currently in the system
          </CardDescription>
        </CardHeader>
        <CardContent>

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
        </CardContent>
      </Card>
    </div>
  );
};

export default DairyListing;