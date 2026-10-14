import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Toaster from './components/ui/Toaster';
import ProtectedRoute from './components/ProtectedRoute';
import RequireAdminRoute from './components/RequireAdminRoute';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import PageSkeleton from './components/PageSkeleton';

/* -------- Eager pages: Landing (first-render target) + public auth -------- */
import Landing from './pages/Landing';

/* -------- Auth group (lazy) -------- */
const Login          = lazy(() => import('./pages/Login'));
const Signup         = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));

/* -------- Customer group (lazy) -------- */
const Dashboard         = lazy(() => import('./pages/Dashboard'));
const Transfer          = lazy(() => import('./pages/Transfer'));
const TransferJara      = lazy(() => import('./pages/TransferJara'));
const TransferBank      = lazy(() => import('./pages/TransferBank'));
const Withdraw          = lazy(() => import('./pages/Withdraw'));
const Airtime           = lazy(() => import('./pages/Airtime'));
const Data              = lazy(() => import('./pages/Data'));
const Electricity       = lazy(() => import('./pages/Electricity'));
const Cable             = lazy(() => import('./pages/Cable'));
const Education         = lazy(() => import('./pages/Education'));
const Notifications     = lazy(() => import('./pages/Notifications'));
const MyJara            = lazy(() => import('./pages/MyJara'));
const CreateGoal        = lazy(() => import('./pages/CreateGoal'));
const GoalDetail        = lazy(() => import('./pages/GoalDetail'));
const CreateGroup       = lazy(() => import('./pages/CreateGroup'));
const JoinGroup         = lazy(() => import('./pages/JoinGroup'));
const GroupDetail       = lazy(() => import('./pages/GroupDetail'));
const Profile           = lazy(() => import('./pages/Profile'));
const EditProfile       = lazy(() => import('./pages/EditProfile'));
const SecurityPin       = lazy(() => import('./pages/SecurityPin'));
const LinkedCards       = lazy(() => import('./pages/LinkedCards'));
const NotificationPrefs = lazy(() => import('./pages/NotificationPrefs'));
const Support           = lazy(() => import('./pages/Support'));
const Settings          = lazy(() => import('./pages/Settings'));
const AllServices       = lazy(() => import('./pages/AllServices'));
const Transactions      = lazy(() => import('./pages/Transactions'));
const Reports           = lazy(() => import('./pages/Reports'));

/* -------- Admin group (lazy) -------- */
const AdminDashboard     = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers         = lazy(() => import('./pages/admin/Users'));
const AdminUserDetail    = lazy(() => import('./pages/admin/UserDetail'));
const AdminTransactions  = lazy(() => import('./pages/admin/Transactions'));
const AdminNotifications = lazy(() => import('./pages/admin/Notifications'));
const AdminGoals         = lazy(() => import('./pages/admin/Goals'));
const AdminGroups        = lazy(() => import('./pages/admin/Groups'));
const AdminProfile       = lazy(() => import('./pages/admin/Profile'));
const AdminSettings      = lazy(() => import('./pages/admin/Settings'));

/* -------- DEV showcases (lazy, DEV-only) -------- */
const LandingPrimitives = lazy(() => import('./pages/dev/LandingPrimitives'));
const UiPrimitives      = lazy(() => import('./pages/dev/UiPrimitives'));

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public (eager landing + lazy auth) */}
              <Route path="/" element={<Landing />} />
              <Route
                path="/login"
                element={<Suspense fallback={<PageSkeleton variant="auth" />}><Login /></Suspense>}
              />
              <Route
                path="/signup"
                element={<Suspense fallback={<PageSkeleton variant="auth" />}><Signup /></Suspense>}
              />
              <Route
                path="/forgot-password"
                element={<Suspense fallback={<PageSkeleton variant="auth" />}><ForgotPassword /></Suspense>}
              />

              {/* Customer group */}
              <Route
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageSkeleton variant="customer" />}>
                      <DashboardLayout />
                    </Suspense>
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-jara" element={<MyJara />} />
                <Route path="/my-jara/new" element={<CreateGoal />} />
                <Route path="/my-jara/:id" element={<GoalDetail />} />
                <Route path="/groups" element={<MyJara />} />
                <Route path="/groups/new" element={<CreateGroup />} />
                <Route path="/groups/join" element={<JoinGroup />} />
                <Route path="/groups/:id" element={<GroupDetail />} />
                <Route path="/transfer" element={<Transfer />} />
                <Route path="/transfer/jara" element={<TransferJara />} />
                <Route path="/transfer/bank" element={<TransferBank />} />
                <Route path="/withdraw" element={<Withdraw />} />
                <Route path="/airtime" element={<Airtime />} />
                <Route path="/data" element={<Data />} />
                <Route path="/electricity" element={<Electricity />} />
                <Route path="/tv" element={<Cable />} />
                <Route path="/education" element={<Education />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/profile/security" element={<SecurityPin />} />
                <Route path="/profile/cards" element={<LinkedCards />} />
                <Route path="/profile/notifications" element={<NotificationPrefs />} />
                <Route path="/profile/support" element={<Support />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/services" element={<AllServices />} />
              </Route>

              {/* Admin group */}
              <Route
                element={
                  <RequireAdminRoute>
                    <Suspense fallback={<PageSkeleton variant="admin" />}>
                      <AdminLayout />
                    </Suspense>
                  </RequireAdminRoute>
                }
              >
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/users/:id" element={<AdminUserDetail />} />
                <Route path="/admin/transactions"  element={<AdminTransactions />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/goals"         element={<AdminGoals />} />
                <Route path="/admin/groups"        element={<AdminGroups />} />
                <Route path="/admin/profile"       element={<AdminProfile />} />
                <Route path="/admin/settings"      element={<AdminSettings />} />
              </Route>

              {import.meta.env.DEV && (
                <Route
                  path="/dev/landing"
                  element={<Suspense fallback={<PageSkeleton />}><LandingPrimitives /></Suspense>}
                />
              )}
              {import.meta.env.DEV && (
                <Route
                  path="/dev/ui"
                  element={<Suspense fallback={<PageSkeleton />}><UiPrimitives /></Suspense>}
                />
              )}

              <Route path="*" element={<Landing />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
