import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { allRoutes } from '../lib/apiRoutes';
import { apiCall } from '../lib/apiCall';
import { Input } from '../components/ui/input';
import { format } from "date-fns";
import { isValid } from 'date-fns';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const DairyReports = () => {
    const { t } = useTranslation();
    const [milkEntries, setMilkEntries] = useState([]);
    const [milkLoading, setMilkLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [canManageMilk, setCanManageMilk] = useState(false);
    const [isFarmerUser, setIsFarmerUser] = useState(false);
    const [selectedFarmer, setSelectedFarmer] = useState("");
    const [selectedShift, setSelectedShift] = useState("all");
    const [farmerList, setFarmerList] = useState([]);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    const fetchMilkEntries = async () => {
        setMilkLoading(true);
        try {
            const formattedStart = startDate ? format(startDate, "yyyy-MM-dd") : null;
            const formattedEnd = endDate ? format(endDate, "yyyy-MM-dd") : null;
            const selectedShiftNEW = selectedShift === "all" ? null : selectedShift;
            const selectedFarmerId = selectedFarmer === "all" ? null : selectedFarmer;

            const response = await apiCall(
                allRoutes.milkCollection.list(selectedFarmerId, formattedStart, formattedEnd, selectedShiftNEW),
                "get"
            );

            if (response.success) {
                setMilkEntries(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching milk entries:", error);
            setMilkEntries([]);
        } finally {
            setMilkLoading(false);
        }
    };


    const getFarmerList = async () => {
        try {
            const response = await apiCall(allRoutes.farmers.getFarmers, "get");
            if (response.success) {
                setFarmerList(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching farmers:', error);
        }
    };

    useEffect(() => {
        fetchMilkEntries();
    }, [selectedFarmer, startDate, endDate, selectedShift]);

    useEffect(() => {
        getFarmerList();
    }, []);

    console.log(startDate, endDate);
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{t("dairyReports.title")}</h1>
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={startDate && isValid(startDate) ? format(startDate, "yyyy-MM-dd") : ""}
                        onChange={(e) =>
                            setStartDate(e.target.value ? new Date(e.target.value) : null)
                        }
                        className="w-40"
                    />

                    {/* To Date */}
                    <Input
                        type="date"
                        value={endDate && isValid(endDate) ? format(endDate, "yyyy-MM-dd") : ""}
                        onChange={(e) =>
                            setEndDate(e.target.value ? new Date(e.target.value) : null)
                        }
                        className="w-40"
                    />
                    <Select value={selectedShift} onValueChange={setSelectedShift}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder={t("dairyReports.selectShift")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("dairyReports.allShifts")}</SelectItem>
                            <SelectItem value="morning">
                                {t("dairyReports.morning")}
                            </SelectItem>
                            <SelectItem value="evening">
                                {t("dairyReports.evening")}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={selectedFarmer} onValueChange={setSelectedFarmer}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder={t("dairyReports.selectFarmer")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("dairyReports.allFarmers")}</SelectItem>
                            {farmerList.map((farmer) => (
                                <SelectItem key={farmer.id} value={farmer.id.toString()}>
                                    {farmer.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('dairyReports.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {milkLoading ? (
                            <div className="text-center py-4">{t("common.loading")}</div>
                        ) : milkEntries.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                {isFarmerUser
                                    ? t("milkCollection.noMyEntries")
                                    : t("dairyReports.noEntries")}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {!isFarmerUser && (
                                            <TableHead>{t("milkCollection.farmerName")}</TableHead>
                                        )}
                                        <TableHead>{t("milkCollection.date")}</TableHead>
                                        <TableHead>{t("milkCollection.shift")}</TableHead>
                                        <TableHead>{t("milkCollection.fat")} </TableHead>
                                        <TableHead>{t("milkCollection.snf")} </TableHead>
                                        <TableHead>{t("milkCollection.quantity")} </TableHead>
                                        <TableHead>{t("milkCollection.rate")} </TableHead>
                                        <TableHead>{t("milkCollection.totalAmount")} (₹)</TableHead>
                                        {canManageMilk && (
                                            <TableHead>{t("common.actions")}</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {milkEntries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            {!isFarmerUser && (
                                                <TableCell>{entry.farmer?.name || "N/A"}</TableCell>
                                            )}
                                            <TableCell>
                                                {new Date(entry.date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        entry.shift === "morning" ? "default" : "secondary"
                                                    }
                                                >
                                                    {t(`milkCollection.${entry.shift}`)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {(parseFloat(entry.fat?.toString() || "0") || 0).toFixed(
                                                    1
                                                )}
                                                %
                                            </TableCell>
                                            <TableCell>
                                                {(parseFloat(entry.snf?.toString() || "0") || 0).toFixed(
                                                    1
                                                )}
                                                %
                                            </TableCell>
                                            <TableCell>
                                                {(
                                                    parseFloat(entry.quantity?.toString() || "0") || 0
                                                ).toFixed(1)}{" "}
                                                L
                                            </TableCell>
                                            <TableCell>
                                                ₹
                                                {(parseFloat(entry.rate?.toString() || "0") || 0).toFixed(
                                                    2
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                ₹
                                                {(
                                                    parseFloat(entry.totalAmount?.toString() || "0") || 0
                                                ).toFixed(2)}
                                            </TableCell>
                                            {canManageMilk && (
                                                <TableCell>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(entry)}
                                                        disabled={isEditMode}
                                                    >
                                                        {t("common.edit")}
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default DairyReports; 