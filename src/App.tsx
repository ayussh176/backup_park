import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookingProvider } from "@/contexts/BookingContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import React, { Suspense } from "react";
const CustomerDashboard = React.lazy(() => import("./pages/CustomerDashboard").then(m => ({ default: m.CustomerDashboard })));
const OwnerDashboard = React.lazy(() => import("./pages/OwnerDashboard").then(m => ({ default: m.OwnerDashboard })));

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
        <BookingProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route 
                    path="/customer-dashboard" 
                    element={
                      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading...</div>}>
                        <CustomerDashboard />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="/owner-dashboard" 
                    element={
                      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading...</div>}>
                        <OwnerDashboard />
                      </Suspense>
                    } 
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </NotificationProvider>
        </BookingProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
);

export default App;
