import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "@/store/useStore";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Mitarbeiter from "./pages/Mitarbeiter";
import MitarbeiterDetail from "./pages/MitarbeiterDetail";
import Vertraege from "./pages/Vertraege";
import Stunden from "./pages/Stunden";
import Rechnungen from "./pages/Rechnungen";
import Kontoauszuege from "./pages/Kontoauszuege";
import Schulden from "./pages/Schulden";
import Einstellungen from "./pages/Einstellungen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Main App component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <StoreProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/mitarbeiter" element={<Mitarbeiter />} />
              <Route path="/mitarbeiter/:id" element={<MitarbeiterDetail />} />
              <Route path="/vertraege" element={<Vertraege />} />
              <Route path="/stunden" element={<Stunden />} />
              <Route path="/rechnungen" element={<Rechnungen />} />
              <Route path="/kontoauszuege" element={<Kontoauszuege />} />
              <Route path="/einstellungen" element={<Einstellungen />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </StoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
