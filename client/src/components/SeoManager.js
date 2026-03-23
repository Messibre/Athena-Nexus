import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ROUTE_META = {
  "/": {
    title: "Athena Nexus | Discipline is the Motivation",
    description:
      "Athena Nexus helps teams complete weekly coding challenges and milestone submissions.",
  },
  "/challenges": {
    title: "Challenges | Athena Nexus",
    description:
      "Track weekly challenge details, deadlines, and submission status.",
  },
  "/milestones": {
    title: "Milestones | Athena Nexus",
    description:
      "Progress through Atlas milestone categories, levels, and challenge submissions.",
  },
  "/gallery": {
    title: "Gallery | Athena Nexus",
    description: "Browse approved weekly and milestone submissions from teams.",
  },
  "/about": {
    title: "About | Athena Nexus",
    description: "Learn about the Athena Nexus mission and platform values.",
  },
  "/privacy": {
    title: "Privacy Policy | Athena Nexus",
    description: "Understand how Athena Nexus collects and protects your data.",
  },
  "/terms": {
    title: "Terms of Service | Athena Nexus",
    description:
      "Review the rules and responsibilities for using Athena Nexus.",
  },
};

const getMetaForPath = (pathname) => {
  if (pathname.startsWith("/gallery/")) {
    return {
      title: "Gallery Week View | Athena Nexus",
      description: "Explore week-specific project submissions and live demos.",
    };
  }

  return (
    ROUTE_META[pathname] || {
      title: "Athena Nexus",
      description:
        "Athena Nexus helps teams complete coding challenges and milestone submissions.",
    }
  );
};

const SeoManager = () => {
  const location = useLocation();

  useEffect(() => {
    const { title, description } = getMetaForPath(location.pathname);
    document.title = title;

    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute("content", description);
    }

    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) {
      ogTitleTag.setAttribute("content", title);
    }

    const ogDescriptionTag = document.querySelector(
      'meta[property="og:description"]',
    );
    if (ogDescriptionTag) {
      ogDescriptionTag.setAttribute("content", description);
    }
  }, [location.pathname]);

  return null;
};

export default SeoManager;
