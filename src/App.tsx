import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Multiplayer from "./pages/Multiplayer";
import { ForceUpdate } from "./components/ForceUpdate";
import { flushPendingScores, installPendingScoresAutoFlush } from "./utils/pendingScoresQueue";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    installPendingScoresAutoFlush();
    flushPendingScores();
  }, []);

  return (

  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ForceUpdate />
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/multiplayer" element={<Multiplayer />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
