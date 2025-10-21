import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { PasscodeProtection } from "@/components/PasscodeProtection";
import { OCWListProvider } from "@/contexts/OCWListContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import QuoteDetails from "./pages/QuoteDetails";
import OCW from "./pages/OCW";
import WindingSheet from "./pages/WindingSheet";
import Configurator from "./pages/Configurator";
import PCBChat from "./pages/PCBChat";
import BOMManager from "./pages/BOMManager";
import MagneticDecay from "./pages/MagneticDecay";
import MagneticFieldSimulator from "./pages/MagneticFieldSimulator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PasscodeProtection>
        <OCWListProvider>
          <BrowserRouter>
            <Navigation />
            <Routes>
              <Route path="/" element={<BOMManager />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/quote/:quoteId" element={<QuoteDetails />} />
              <Route path="/ocw" element={<OCW />} />
              <Route path="/winding-sheet" element={<WindingSheet />} />
              <Route path="/configurator" element={<Configurator />} />
              <Route path="/pcb-chat" element={<PCBChat />} />
              <Route path="/calculator" element={<Index />} />
              <Route path="/magnetic-decay" element={<MagneticDecay />} />
              <Route path="/field-simulator" element={<MagneticFieldSimulator />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </OCWListProvider>
      </PasscodeProtection>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
