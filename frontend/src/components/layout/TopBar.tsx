import { useLocation } from "react-router-dom";

function getPageTitle(pathname: string): string {
  if (pathname.endsWith("/events")) {
    return "Events Portfolio";
  }

  return "Advanced Infrastructure Team Hub";
}

export default function TopBar() {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="top-bar">
      <div className="top-bar__title">{pageTitle}</div>

      <div className="top-bar__actions">
        <span className="fiscal-badge">FY2026</span>

        <button
          className="user-avatar"
          type="button"
          aria-label="Open user menu"
          title="User profile"
        >
          U
        </button>
      </div>
    </header>
  );
}
