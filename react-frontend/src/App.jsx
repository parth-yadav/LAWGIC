import { Routes, Route } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import SecureLayout from "@/layouts/SecureLayout";
import DocumentLayout from "@/layouts/DocumentLayout";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProfilePage from "@/pages/ProfilePage";
import DocumentPage from "@/pages/DocumentPage";
import DynamicFavicon from "@/components/DynamicFavicon";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <>
      <DynamicFavicon />
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Document viewer routes */}
        <Route element={<DocumentLayout />}>
          <Route path="/documents/:documentId" element={<DocumentPage />} />
        </Route>

        {/* Main layout routes */}
        <Route element={<MainLayout />}>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />

          {/* Secure routes (require auth) */}
          <Route element={<SecureLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster richColors />
    </>
  );
}

export default App;
