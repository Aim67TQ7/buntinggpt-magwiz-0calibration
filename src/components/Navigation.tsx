import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calculator, BarChart3, Zap, Home, Settings, MessageSquare, Database } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      path: "/",
      label: "OCW History",
      icon: BarChart3,
    },
    {
      path: "/ocw",
      label: "OCW Selector",
      icon: Zap,
    },
    {
      path: "/configurator",
      label: "Configurator",
      icon: Settings,
    },
    {
      path: "/pcb-chat",
      label: "PCB Assistant",
      icon: MessageSquare,
    },
    {
      path: "/bom-manager",
      label: "BOM Manager",
      icon: Database,
    },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <Home className="h-6 w-6" />
              <span className="font-bold text-lg">MagWiz 3.1</span>
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