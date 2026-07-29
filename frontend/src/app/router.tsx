import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import EventsPage from "../pages/EventsPage";
import HomePage from "../pages/HomePage.tsx";
import NotFoundPage from "../pages/NotFoundPage";
import EventsLayout from "../components/events/layout/EventsLayout";

const baseName = import.meta.env.BASE_URL.replace(/\/$/, "");

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppLayout />,
      children: [
        {
          index: true,
          element: <HomePage />,
        },
        {
          path: "events",
          element: <EventsLayout />,
          children: [
            {
              index: true,
              element: <EventsPage />,
            },
          ],
        },
        {
          path: "*",
          element: <NotFoundPage />,
        },
      ],
    },
  ],
  {
    basename: baseName,
  },
);
