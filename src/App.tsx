import { useEffect, useState } from "react";
import LoadingScreen from "./components/LoadingScreen";
import { useAssetPreloader } from "./hooks/useAssetPreloader";
import { LAUNCH_ASSETS } from "./utils/preloadAssets";
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
  const { progress, done } = useAssetPreloader(LAUNCH_ASSETS, { minDurationMs: 2500 });
  const [showLoader, setShowLoader] = useState(true);
  useEffect(() => {
    installPendingScoresAutoFlush();
    flushPendingScores();
  }, []);

  return (

  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="app-backdrop" aria-hidden="true" />
      <ForceUpdate />
      <Toaster />
      <Sonner />
      {done && (
      <HashRouter>
        <div className="app-content">
        <div className="app-screens">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/multiplayer" element={<Multiplayer />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </div>
        </div>
      </HashRouter>
      )}
      {showLoader && (
        <LoadingScreen progress={progress} done={done} onFinished={() => setShowLoader(false)} />
      )}
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
