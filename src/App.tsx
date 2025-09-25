import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthCheck } from "@/components/AuthCheck";
import { LoadingTransition } from "@/components/LoadingTransition";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Library = lazy(() => import("./pages/Library"));
const MangaDetails = lazy(() => import("./pages/MangaDetails"));
const MangaReader = lazy(() => import("./pages/MangaReader"));
const Profile = lazy(() => import("./pages/Profile"));
const Favorites = lazy(() => import("./pages/Favorites"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const MangaForm = lazy(() => import("./pages/admin/MangaForm"));
const ChapterManager = lazy(() => import("./pages/admin/ChapterManager"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <AuthCheck>
              <Suspense fallback={
                <LoadingTransition isLoading={true} delay={0}>
                  <div />
                </LoadingTransition>
              }>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } />
                  <Route path="/library" element={
                    <ProtectedRoute>
                      <Library />
                    </ProtectedRoute>
                  } />
                  <Route path="/manga/:id" element={
                    <ProtectedRoute>
                      <MangaDetails />
                    </ProtectedRoute>
                  } />
                  <Route path="/manga/:mangaId/chapter/:chapterId" element={
                    <ProtectedRoute>
                      <MangaReader />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile-setup" element={
                    <ProtectedRoute>
                      <ProfileSetup />
                    </ProtectedRoute>
                  } />
                  <Route path="/favorites" element={
                    <ProtectedRoute>
                      <Favorites />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/manga/new" element={
                    <ProtectedRoute>
                      <MangaForm />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/manga/:mangaId/edit" element={
                    <ProtectedRoute>
                      <MangaForm />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/manga/:mangaId/chapters" element={
                    <ProtectedRoute>
                      <ChapterManager />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthCheck>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;