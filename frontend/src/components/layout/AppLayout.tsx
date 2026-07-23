import { Outlet } from "react-router-dom";
import AppRail from "./AppRail";
import Launcher from "./Launcher";
import TopBar from "./TopBar";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <AppRail />

      <div className="app-shell__main">
        <TopBar />

        <div className="app-shell__body">
          <Launcher />

          <main className="page-view">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
