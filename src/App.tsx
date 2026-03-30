import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Pipeline from "@/pages/Pipeline";
import Conversations from "@/pages/Conversations";
import ConversationDetail from "@/pages/ConversationDetail";
import Contacts from "@/pages/Contacts";
import ContactDetail from "@/pages/ContactDetail";
import Tasks from "@/pages/Tasks";
import Settings from "@/pages/Settings";
import OpportunityDetail from "@/pages/OpportunityDetail";
import FlowList from "@/pages/FlowList";
import FlowBuilder from "@/pages/FlowBuilder";
import Communities from "@/pages/Communities";
import Campaigns from "@/pages/Campaigns";
import CampaignLanding from "@/pages/CampaignLanding";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/entrar/:slug" element={<CampaignLanding />} />
      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="conversas" element={<Conversations />} />
        <Route path="conversas/:id" element={<ConversationDetail />} />
        <Route path="tarefas" element={<Tasks />} />
        <Route path="contatos" element={<Contacts />} />
        <Route path="contatos/:type/:id" element={<ContactDetail />} />
        <Route path="oportunidades/:id" element={<OpportunityDetail />} />
        <Route path="fluxos" element={<FlowList />} />
        <Route path="fluxos/:id" element={<FlowBuilder />} />
        <Route path="comunidades" element={<Communities />} />
        <Route path="campanhas" element={<Campaigns />} />
        <Route path="configuracoes" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
