import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { checkApiHealth } from '@/lib/apiCall';

interface ApiStatus {
  timestamp: string;
  status: 'success' | 'error';
  message: string;
  details?: any;
}

export default function ApiDebugger() {
  const [apiStatus, setApiStatus] = useState<ApiStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    const result = await checkApiHealth();
    
    const status: ApiStatus = {
      timestamp: new Date().toISOString(),
      status: result.success ? 'success' : 'error',
      message: result.success ? 'API is healthy' : 'API check failed',
      details: result.error || result.data
    };
    
    setApiStatus(prev => [status, ...prev.slice(0, 9)]); // Keep last 10 checks
    setIsChecking(false);
  };

  useEffect(() => {
    // Auto-check on component mount
    checkHealth();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          API Debugger
          <Button 
            onClick={checkHealth} 
            disabled={isChecking}
            size="sm"
          >
            {isChecking ? 'Checking...' : 'Check Health'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {apiStatus.map((status, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-2">
                <Badge variant={status.status === 'success' ? 'default' : 'destructive'}>
                  {status.status}
                </Badge>
                <span className="text-sm">{status.message}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(status.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {apiStatus.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No API checks performed yet
            </p>
          )}
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded">
          <h4 className="font-medium mb-2">Debug Information:</h4>
          <ul className="text-sm space-y-1">
            <li>• Base URL: {window.location.origin}/api</li>
            <li>• Environment: {import.meta.env.MODE}</li>
            <li>• User Agent: {navigator.userAgent}</li>
            <li>• Online Status: {navigator.onLine ? 'Online' : 'Offline'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 