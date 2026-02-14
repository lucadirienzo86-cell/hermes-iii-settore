import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import RoleGuard from "./components/guards/RoleGuard";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAppRoute from "./components/ProtectedAppRoute";

// Public pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";

// Admin/Core pages
import Dashboard from "./pages/Dashboard";
import Utenti from "./pages/Utenti";
import AdminOpzioni from "./pages/AdminOpzioni";

// Institutional pages (Comune/Assessorato)
import ComuneAuth from "./pages/ComuneAuth";
import Scrivania from "./pages/Scrivania";
import AnagrafeAssociazioni from "./pages/AnagrafeAssociazioni";
import AssociazioneDettaglio from "./pages/AssociazioneDettaglio";
import AnagraficheAssessorato from "./pages/AnagraficheAssessorato";
import TerzoSettoreDashboard from "./pages/TerzoSettoreDashboard";
import RegistrazioneAssociazione from "./pages/RegistrazioneAssociazione";

// Pro Loco pages
import ProLocoAuth from "./pages/ProLocoAuth";
import ProLocoDashboard from "./pages/ProLocoDashboard";
import ProLocoProfilo from "./pages/ProLocoProfilo";

// Partner pages
import PartnerLogin from "./pages/partner/Login";

// Service pages
import ServiceLogin from "./pages/service/Login";

// Admin pages
import AdminAuth from "./pages/admin/Auth";

// Associazione pages - NEW STRUCTURE
import AssociazioneAuth from "./pages/AssociazioneAuth";
import AssociazioneDashboard from "./pages/associazione/Dashboard";
import AssociazioneOnboarding from "./pages/AssociazioneOnboarding";
import AssociazioneProfilo from "./pages/AssociazioneProfilo";
import AssociazioneBandi from "./pages/associazione/Bandi";
import AssociazioneProgetti from "./pages/associazione/Progetti";
import AssociazionePagamenti from "./pages/associazione/Pagamenti";
import AssociazioneDocumenti from "./pages/associazione/Documenti";
import AssociazioneNotifiche from "./pages/associazione/Notifiche";
import AssociazioneContabilita from "./pages/associazione/Contabilita";
import RendicontoCassa from "./pages/associazione/RendicontoCassa";

// SONIC / Trova Bandi module (BLACK BOX - do not modify)
import TrovaBandi from "./pages/TrovaBandi";
import BandiAssociazione from "./pages/BandiAssociazione";
import Bandi from "./pages/Bandi";

// Profile pages (kept for role-specific profiles)
import ProfiloUtente from "./pages/ProfiloUtente";
import ProfiloDocente from "./pages/ProfiloDocente";
import ProfiloGestore from "./pages/ProfiloGestore";
import ProfiloGestorePratiche from "./pages/ProfiloGestorePratiche";

// App routes for Aziende
import AppAuth from "./pages/app/Auth";
import AppDashboard from "./pages/app/Dashboard";
import AppProfilo from "./pages/app/Profilo";
import AppBandi from "./pages/app/Bandi";
import AppBandoDettaglio from "./pages/app/BandoDettaglio";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* ===== PUBLIC ROUTES ===== */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/registrazione-associazione" element={<RegistrazioneAssociazione />} />
              
              {/* ===== AUTH ROUTES (per role) ===== */}
              <Route path="/comune/auth" element={<ComuneAuth />} />
              <Route path="/proloco/auth" element={<ProLocoAuth />} />
              <Route path="/proloco/login" element={<ProLocoAuth />} />
              <Route path="/pro-loco/auth" element={<ProLocoAuth />} />
              <Route path="/associazione/auth" element={<AssociazioneAuth />} />
              <Route path="/admin/auth" element={<AdminAuth />} />
              <Route path="/app/auth" element={<AppAuth />} />
              <Route path="/partner/login" element={<PartnerLogin />} />
              <Route path="/service/login" element={<ServiceLogin />} />
              
              {/* ================================================================ */}
              {/* ===== ISTITUZIONALE ROUTES (Comune / Assessorato) ===== */}
              {/* ================================================================ */}
              <Route path="/istituzionale" element={<Navigate to="/istituzionale/dashboard" replace />} />
              <Route 
                path="/istituzionale/dashboard" 
                element={
                  <RoleGuard allowedRoles={['comune', 'assessorato_terzo_settore']} loginPath="/comune/auth">
                    <Scrivania />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/istituzionale/associazioni" 
                element={
                  <RoleGuard allowedRoles={['comune', 'assessorato_terzo_settore']} loginPath="/comune/auth">
                    <AnagrafeAssociazioni />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/istituzionale/associazioni/:id" 
                element={
                  <RoleGuard allowedRoles={['comune', 'assessorato_terzo_settore']} loginPath="/comune/auth">
                    <AssociazioneDettaglio />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/istituzionale/bandi" 
                element={
                  <RoleGuard allowedRoles={['comune', 'assessorato_terzo_settore']} loginPath="/comune/auth">
                    <TrovaBandi />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/istituzionale/progetti" 
                element={
                  <RoleGuard allowedRoles={['comune', 'assessorato_terzo_settore']} loginPath="/comune/auth">
                    <TerzoSettoreDashboard />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/istituzionale/notifiche" 
                element={
                  <RoleGuard allowedRoles={['comune', 'assessorato_terzo_settore']} loginPath="/comune/auth">
                    <AnagraficheAssessorato />
                  </RoleGuard>
                } 
              />
              
              {/* Legacy routes → redirect to new structure */}
              <Route path="/terzo-settore" element={<Navigate to="/istituzionale/progetti" replace />} />
              <Route path="/anagrafe-associazioni" element={<Navigate to="/istituzionale/associazioni" replace />} />
              <Route path="/associazione/:id" element={<Navigate to="/istituzionale/associazioni/:id" replace />} />
              <Route path="/anagrafiche-assessorato" element={<Navigate to="/istituzionale/notifiche" replace />} />
              <Route path="/trova-bandi" element={<Navigate to="/istituzionale/bandi" replace />} />
              <Route path="/bandi-associazione" element={<Navigate to="/istituzionale/bandi" replace />} />
              <Route path="/bandi" element={<Navigate to="/istituzionale/bandi" replace />} />
              
              {/* ================================================================ */}
              {/* ===== ASSOCIAZIONE ROUTES ===== */}
              {/* ================================================================ */}
              <Route path="/associazione" element={<Navigate to="/associazione/dashboard" replace />} />
              <Route 
                path="/associazione/dashboard" 
                element={
                  <RoleGuard allowedRoles={['associazione']} loginPath="/associazione/auth">
                    <AssociazioneDashboard />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/associazione/onboarding" 
                element={
                  <RoleGuard allowedRoles={['associazione']} loginPath="/associazione/auth">
                    <AssociazioneOnboarding />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/associazione/profilo" 
                element={
                  <RoleGuard allowedRoles={['associazione']} loginPath="/associazione/auth">
                    <AssociazioneProfilo />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/associazione/bandi" 
                element={
                  <RoleGuard allowedRoles={['associazione']} loginPath="/associazione/auth">
                    <AssociazioneBandi />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/associazione/progetti" 
                element={
                  <RoleGuard allowedRoles={['associazione']} loginPath="/associazione/auth">
                    <AssociazioneProgetti />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/associazione/progetti/:id" 
                element={
                  <RoleGuard allowedRoles={['associazione']} loginPath="/associazione/auth">
                    <AssociazioneProgetti />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/associazione/progetti/:id/rendiconto" 
                element={
                  <RoleGuard allowedRoles={['associazione']} loginPath="/associazione/auth">
                    <AssociazioneProgetti />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/associazione/pagamenti" 
                element={
                  <RoleGuard allowedRoles={['associazione']} loginPath="/associazione/auth">
                    <AssociazionePagamenti />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/associazione/documenti" 
                element={
                  <RoleGuard allowedRoles={['associazione']} loginPath="/associazione/auth">
                    <AssociazioneDocumenti />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/associazione/notifiche" 
                element={
                  <RoleGuard allowedRoles={['associazione']} loginPath="/associazione/auth">
                    <AssociazioneNotifiche />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/associazione/contabilita" 
                element={
                  <RoleGuard allowedRoles={['associazione']} loginPath="/associazione/auth">
                    <AssociazioneContabilita />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/associazione/rendiconto-cassa" 
                element={
                  <RoleGuard allowedRoles={['associazione']} loginPath="/associazione/auth">
                    <RendicontoCassa />
                  </RoleGuard>
                } 
              />
              
              {/* ================================================================ */}
              {/* ===== PRO LOCO ROUTES ===== */}
              {/* ================================================================ */}
              <Route path="/pro-loco" element={<Navigate to="/proloco/dashboard" replace />} />
              <Route path="/pro-loco/dashboard" element={<Navigate to="/proloco/dashboard" replace />} />
              <Route 
                path="/proloco/dashboard" 
                element={
                  <RoleGuard allowedRoles={['pro_loco']} loginPath="/pro-loco/auth">
                    <ProLocoDashboard />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/proloco/profilo" 
                element={
                  <RoleGuard allowedRoles={['pro_loco']} loginPath="/pro-loco/auth">
                    <ProLocoProfilo />
                  </RoleGuard>
                } 
              />
              {/* Legacy route */}
              <Route path="/pro-loco/profilo" element={<Navigate to="/proloco/profilo" replace />} />
              
              {/* ================================================================ */}
              {/* ===== AZIENDA (APP) ROUTES ===== */}
              {/* ================================================================ */}
              <Route 
                path="/app/dashboard" 
                element={
                  <ProtectedAppRoute>
                    <AppDashboard />
                  </ProtectedAppRoute>
                } 
              />
              <Route 
                path="/app/profilo" 
                element={
                  <ProtectedAppRoute>
                    <AppProfilo />
                  </ProtectedAppRoute>
                } 
              />
              <Route 
                path="/app/bandi" 
                element={
                  <ProtectedAppRoute>
                    <AppBandi />
                  </ProtectedAppRoute>
                } 
              />
              <Route 
                path="/app/bandi/:id" 
                element={
                  <ProtectedAppRoute>
                    <AppBandoDettaglio />
                  </ProtectedAppRoute>
                } 
              />
              
              {/* ================================================================ */}
              {/* ===== ADMIN ROUTES ===== */}
              {/* ================================================================ */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <RoleGuard allowedRoles={['admin']} loginPath="/auth">
                    <Dashboard />
                  </RoleGuard>
                } 
              />
              <Route
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/utenti" 
                element={
                  <RoleGuard allowedRoles={['admin']} loginPath="/auth">
                    <Utenti />
                  </RoleGuard>
                } 
              />
              <Route
                path="/admin/opzioni"
                element={
                  <RoleGuard allowedRoles={['admin']} loginPath="/auth">
                    <AdminOpzioni />
                  </RoleGuard>
                }
              />
              
              {/* ===== PROFILE ROUTES ===== */}
              <Route path="/profilo" element={<ProfiloUtente />} />
              <Route
                path="/profilo-docente"
                element={
                  <ProtectedRoute>
                    <ProfiloDocente />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profilo-gestore"
                element={
                  <ProtectedRoute>
                    <ProfiloGestore />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profilo-gestore-pratiche"
                element={
                  <ProtectedRoute>
                    <ProfiloGestorePratiche />
                  </ProtectedRoute>
                }
              />
              
              {/* ===== CATCH-ALL ===== */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
