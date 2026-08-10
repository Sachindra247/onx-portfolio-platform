import { useEffect, useRef, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";

function getPageTitle(pathname: string): string {
  if (pathname.endsWith("/events")) {
    return "Events Portfolio";
  }

  if (pathname.endsWith("/certifications")) {
    return "Certification Tracker";
  }

  if (pathname.endsWith("/vacations")) {
    return "Vacation Tracker";
  }

  if (pathname.endsWith("/profile")) {
    return "My Profile";
  }

  return "Advanced Infrastructure Team Hub";
}

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const pageTitle = getPageTitle(location.pathname);

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "U";

  const displayRole = user?.isGlobalAdministrator
    ? "Global Administrator"
    : (user?.role ?? "User");

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  function handleSignOut() {
    setIsUserMenuOpen(false);
    logout();
    navigate("/login", {
      replace: true,
    });
  }

  return (
    <header className="top-bar">
      <h1 className="top-bar__title">{pageTitle}</h1>

      <div className="top-bar__actions">
        <div className="top-bar-user" ref={menuRef}>
          <button
            className="user-avatar"
            type="button"
            aria-label="Open user menu"
            aria-expanded={isUserMenuOpen}
            title={user ? `${user.firstName} ${user.lastName}` : "User profile"}
            onClick={() => setIsUserMenuOpen((current) => !current)}
          >
            {initials}
          </button>

          {isUserMenuOpen && (
            <div className="top-bar-user-menu">
              <div className="top-bar-user-menu__identity">
                <strong>
                  {user ? `${user.firstName} ${user.lastName}` : "User"}
                </strong>

                <span>{user?.email}</span>

                <small>
                  {displayRole}
                  {user?.group ? ` · ${user.group}` : ""}
                </small>
              </div>

              <div className="top-bar-user-menu__actions">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate("/profile");
                  }}
                >
                  <UserRound size={15} aria-hidden="true" />
                  Profile
                </button>

                <button
                  type="button"
                  className="top-bar-user-menu__sign-out"
                  onClick={handleSignOut}
                >
                  <LogOut size={15} aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
