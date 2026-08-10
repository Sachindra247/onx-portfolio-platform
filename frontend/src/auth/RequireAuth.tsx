import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./AuthContext";

export default function RequireAuth() {
  const { isAuthenticated, isInitializing } = useAuth();

  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-screen__card">
          <span className="auth-loading-screen__brand">ONX</span>

          <p>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
        }}
      />
    );
  }

  return <Outlet />;
}
