import { NavLink } from "react-router-dom";
import { appModules } from "../../config/modules";

export default function Launcher() {
  return (
    <aside className="launcher" aria-label="Application launcher">
      <div className="launcher__heading">Applications</div>

      <div className="launcher__items">
        {appModules.map((module) => {
          const Icon = module.icon;

          if (module.status === "coming-soon" || !module.path) {
            return (
              <div
                className="launcher-item launcher-item--disabled"
                key={module.id}
                aria-disabled="true"
              >
                <span
                  className={`launcher-item__icon module-accent module-accent--${module.accent}`}
                >
                  <Icon size={18} aria-hidden="true" />
                </span>

                <span className="launcher-item__content">
                  <span className="launcher-item__name">
                    {module.shortName}
                  </span>
                  <span className="launcher-item__summary">Coming soon</span>
                </span>
              </div>
            );
          }

          return (
            <NavLink
              className={({ isActive }) =>
                ["launcher-item", isActive ? "launcher-item--active" : ""]
                  .filter(Boolean)
                  .join(" ")
              }
              to={module.path}
              key={module.id}
            >
              <span
                className={`launcher-item__icon module-accent module-accent--${module.accent}`}
              >
                <Icon size={18} aria-hidden="true" />
              </span>

              <span className="launcher-item__content">
                <span className="launcher-item__name">{module.shortName}</span>
                <span className="launcher-item__summary">{module.summary}</span>
              </span>

              <span className="launcher-item__indicator" aria-hidden="true" />
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
