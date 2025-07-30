import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, AlertTriangle, ArrowLeft, RefreshCw, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <Card className="w-full max-w-2xl shadow-lg border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-destructive/10 rounded-full animate-pulse"></div>
          <AlertTriangle className="h-20 w-20 text-destructive relative z-10 animate-bounce" />
        </div>
          </div>
          <CardTitle className="text-6xl font-bold text-foreground mb-3 bg-gradient-to-r from-destructive to-destructive/70 bg-clip-text text-transparent">
        404
          </CardTitle>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Page Not Found</h2>
          <p className="text-muted-foreground">
        The page you requested does not exist.
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {location.pathname !== "/" && (
        <div className="bg-muted/50 p-4 rounded-lg border border-border/50 mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Attempted Route</span>
          </div>
          <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
            {location.pathname}
          </Badge>
        </div>
          )}

          <div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button 
            onClick={() => window.history.back()} 
            variant="outline"
            className="flex items-center gap-2 h-12"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="flex items-center gap-2 h-12"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => window.location.href = "/"} 
            className="bg-primary hover:bg-primary/90 flex items-center gap-2 h-12"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
        </div>
          </div>

          <div className="pt-4 border-t border-border/50">
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.href = "/inventory"}
            className="text-muted-foreground"
          >
            Inventory
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.href = "/orders"}
            className="text-muted-foreground"
          >
            Orders
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.href = "/customers"}
            className="text-muted-foreground"
          >
            Customers
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.href = "/suppliers"}
            className="text-muted-foreground"
          >
            Suppliers
          </Button>
        </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
