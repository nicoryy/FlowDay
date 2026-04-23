import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/routes/Dashboard";
import { Tasks } from "@/routes/Tasks";
import { History } from "@/routes/History";
import { Settings } from "@/routes/Settings";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Toaster } from "@/components/ui/Toaster";
import { ApiSetup } from "@/components/ui/ApiSetup";
import { getStoredApiUrl, onApiUrlChange } from "@/stores/apiUrl";

export default function App() {
  const [hasApiUrl, setHasApiUrl] = useState(() => !!getStoredApiUrl());

  useEffect(() => onApiUrlChange(() => setHasApiUrl(!!getStoredApiUrl())), []);

  return (
    <ErrorBoundary>
      {!hasApiUrl ? (
        <ApiSetup />
      ) : (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="history" element={<History />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}
      <Toaster />
    </ErrorBoundary>
  );
}
