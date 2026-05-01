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

const buildCanonicalUrl = (pathname) => {
  if (typeof window === "undefined") {
    return pathname;
  }

  return `${window.location.origin}${pathname}`;
};

const upsertMetaTag = (selector, attribute, value, createAttributes = {}) => {
  let tag = document.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    Object.entries(createAttributes).forEach(([key, entryValue]) => {
      tag.setAttribute(key, entryValue);
    });
    document.head.appendChild(tag);
  }

  tag.setAttribute(attribute, value);
};

const upsertLinkTag = (selector, attributes) => {
  let tag = document.querySelector(selector);
  if (!tag) {
    tag = document.createElement("link");
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([attribute, value]) => {
    tag.setAttribute(attribute, value);
  });
};

const SeoManager = () => {
  const location = useLocation();

  useEffect(() => {
    const { title, description } = getMetaForPath(location.pathname);
    const canonicalUrl = buildCanonicalUrl(location.pathname);
    document.title = title;

    upsertMetaTag('meta[name="description"]', "content", description);
    upsertMetaTag('meta[property="og:title"]', "content", title);
    upsertMetaTag('meta[property="og:description"]', "content", description);
    upsertMetaTag('meta[property="og:url"]', "content", canonicalUrl);
    upsertMetaTag('meta[name="twitter:title"]', "content", title);
    upsertMetaTag('meta[name="twitter:description"]', "content", description);
    upsertMetaTag('meta[name="twitter:image"]', "content", `${window.location.origin}/athena.jpg`);
    upsertMetaTag('meta[property="og:image"]', "content", `${window.location.origin}/athena.jpg`);
    upsertLinkTag('link[rel="canonical"]', {
      rel: "canonical",
      href: canonicalUrl,
    });
  }, [location.pathname]);

  return null;
};

export default SeoManager;
