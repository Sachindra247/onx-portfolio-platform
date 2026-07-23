import { ArrowRight, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import type { AppModule } from "../../config/modules";

interface ModuleCardProps {
  module: AppModule;
}

export default function ModuleCard({ module }: ModuleCardProps) {
  const Icon = module.icon;
  const path = module.path;

  const isAvailable = module.status === "available" && typeof path === "string";

  const cardContent = (
    <>
      <div className="module-card__top-row">
        <span
          className={`module-card__icon module-accent module-accent--${module.accent}`}
        >
          <Icon size={27} aria-hidden="true" />
        </span>

        {isAvailable ? (
          <ArrowRight
            className="module-card__arrow"
            size={19}
            aria-hidden="true"
          />
        ) : (
          <span className="coming-soon-badge">
            <Clock3 size={12} aria-hidden="true" />
            Coming soon
          </span>
        )}
      </div>

      <div>
        <h2 className="module-card__title">{module.name}</h2>
        <p className="module-card__description">{module.description}</p>
      </div>

      <div className="module-card__footer">{module.summary}</div>
    </>
  );

  if (!isAvailable) {
    return (
      <article className="module-card module-card--disabled">
        {cardContent}
      </article>
    );
  }

  return (
    <Link className="module-card" to={path}>
      {cardContent}
    </Link>
  );
}
