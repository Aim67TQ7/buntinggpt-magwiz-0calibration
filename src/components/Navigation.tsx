import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calculator, BarChart3, Zap, Home, Settings, MessageSquare, Database, GitCompare, LineChart, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updates, UpdatesContent } from "@/pages/Updates";

export const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const latestVersion = updates[0]?.version || "3.12.0";

  const navItems = [
    {
      path: "/dashboard",
      label: "OCW History",
      icon: BarChart3,
    },
    {
      path: "/ocw",
      label: "OCW Selector",
      icon: Zap,
    },
    {
      path: "/ocw-model-comparison",
      label: "Model Comparison",
      icon: TrendingUp,
    },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <Home className="h-6 w-6" />
              <div className="flex flex-col">
                <span className="font-bold text-lg">MagWiz 3</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-xs text-muted-foreground hover:text-primary transition-colors text-left cursor-pointer">
                      {latestVersion}
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>MagWiz 3 Updates</DialogTitle>
                      <DialogDescription>Version history and release notes</DialogDescription>
                    </DialogHeader>
                    <UpdatesContent />
                  </DialogContent>
                </Dialog>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};
