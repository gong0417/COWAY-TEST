import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ReliabilityDataProvider } from "@/context/ReliabilityDataContext";
import { SearchProvider } from "@/context/SearchContext";
import { AdminAccessDeniedPage } from "@/pages/AdminAccessDeniedPage";
import { AdminPage } from "@/pages/AdminPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { FailuresPage } from "@/pages/FailuresPage";
import { InspectionPage } from "@/pages/InspectionPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ReliabilityPage } from "@/pages/ReliabilityPage";

function AppShell() {
  return (
    <ReliabilityDataProvider>
      <SearchProvider>
        <Outlet />
      </SearchProvider>
    </ReliabilityDataProvider>
  );
}

function AdminPageGuard() {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return <AdminAccessDeniedPage />;
  }
  return <AdminPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/inspection" element={<InspectionPage />} />
              <Route path="/failures" element={<FailuresPage />} />
              <Route path="/reliability" element={<ReliabilityPage />} />
              <Route path="/admin" element={<AdminPageGuard />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
