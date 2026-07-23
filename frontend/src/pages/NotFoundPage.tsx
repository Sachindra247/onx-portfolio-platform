import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="not-found-page">
      <p className="not-found-page__code">404</p>
      <h1>Page not found</h1>
      <p>The requested application page does not exist.</p>

      <Link className="secondary-button" to="/">
        <ArrowLeft size={16} aria-hidden="true" />
        Return to home
      </Link>
    </section>
  );
}
