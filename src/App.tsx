
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/styles/brandOverrides.css";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Hub from "./pages/Hub";
import ComingSoon from "./pages/ComingSoon";
import CaseEvaluator from "./components/CaseEvaluator";
import MediatorProposal from "./components/MediatorProposal";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <BrowserRouter>
            <Routes>
              <Route path="/hub" element={<Hub />} />
              <Route path="/" element={<Index />} />
              <Route path="/evaluator" element={<CaseEvaluator />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/wc_coming_soon" element={<ComingSoon title="Workers' Comp Module" />} />
              <Route path="/divorce_coming_soon" element={<ComingSoon title="Divorce Module" />} />
              <Route path="/mediator" element={
                <MediatorProposal 
                  mediatorProposal="$99,000"
                  evaluator="$105,000"
                  rationale="Based on analysis of comparable cases in Los Angeles County with shoulder injuries, considering policy limits of $250,000."
                  sourceRows={[123, 456, 789]}
                  expiresOn="January 12, 2025"
                />
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
