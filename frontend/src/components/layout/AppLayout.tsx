import { Outlet } from "react-router-dom";
import AppRail from "./AppRail";

import TopBar from "./TopBar";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <AppRail />

      <div className="app-shell__main">
        <TopBar />

        <div className="app-shell__body">
          <main className="page-view">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
