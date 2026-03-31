import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ReliabilityDataProvider } from "@/context/ReliabilityDataContext";
import { SearchProvider } from "@/context/SearchContext";
import { AdminPage } from "@/pages/AdminPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { FailuresPage } from "@/pages/FailuresPage";
import { InspectionPage } from "@/pages/InspectionPage";
import { ReliabilityPage } from "@/pages/ReliabilityPage";

export default function App() {
  return (
    <BrowserRouter>
      <ReliabilityDataProvider>
        <SearchProvider>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/inspection" element={<InspectionPage />} />
            <Route path="/failures" element={<FailuresPage />} />
            <Route path="/reliability" element={<ReliabilityPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SearchProvider>
      </ReliabilityDataProvider>
    </BrowserRouter>
  );
}
