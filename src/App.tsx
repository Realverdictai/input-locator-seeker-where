
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
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
              <Route path="/" element={<Index />} />
              <Route path="/evaluator" element={<CaseEvaluator />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/mediator" element={
                <MediatorProposal 
                  proposal="$99,000"
                  rationale="Based on analysis of comparable cases in Los Angeles County with shoulder injuries, considering policy limits of $250,000."
                  sourceCaseID={123}
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
