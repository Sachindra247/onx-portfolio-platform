import { LayoutGrid } from "lucide-react";
import ModuleCard from "../components/modules/ModuleCard";
import { appModules } from "../config/modules";

export default function HomePage() {
  return (
    <section className="home-page">
      <div className="home-page__intro">
        <div className="home-page__mark" aria-hidden="true">
          <LayoutGrid size={31} />
        </div>

        <p className="home-page__eyebrow">OnX internal applications</p>

        <h1>Advanced Infrastructure Team Hub</h1>

        <p className="home-page__description">
          Access tools for managing events and future team portfolio activities
          from one central workspace.
        </p>
      </div>

      <div className="module-grid">
        {appModules.map((module) => (
          <ModuleCard module={module} key={module.id} />
        ))}
      </div>
    </section>
  );
}
