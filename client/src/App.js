import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import { fetchMe } from "./redux/thunks/authThunks";
import { selectTheme } from "./redux/selectors/themeSelectors";
import { selectUser } from "./redux/selectors/authSelectors";
import MiniModal from "./components/MiniModal";
import WelcomeModal, { shouldShowWelcome } from "./components/WelcomeModal";
import CookieConsent from "./components/CookieConsent";
import SeoManager from "./components/SeoManager";
import FeedbackButton from "./components/FeedbackButton";
import LoadingScreen from "./components/LoadingScreen";
import "./App.css";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Submit = lazy(() => import("./pages/Submit"));
const Settings = lazy(() => import("./pages/Settings"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Gallery = lazy(() => import("./pages/Gallery"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const About = lazy(() => import("./pages/About"));
const Milestones = lazy(() => import("./pages/Milestones"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LAST_ROUTE_KEY = "lastRoute.v1";

function AppContent() {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const user = useSelector(selectUser);
  const location = useLocation();
  const mainRef = useRef(null);
  const [modalState, setModalState] = useState({
    open: false,
    title: "Error",
    message: "",
  });

  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    try {
      if (shouldShowWelcome()) setShowWelcome(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!user) {
      dispatch(fetchMe());
    }
  }, [user, dispatch]);

  useEffect(() => {
    const excludedPaths = ["/login", "/signup", "/privacy", "/terms"];
    if (!excludedPaths.includes(location.pathname)) {
      localStorage.setItem(
        LAST_ROUTE_KEY,
        `${location.pathname}${location.search || ""}`,
      );
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    mainRef.current?.focus();
  }, [location.pathname]);

  useEffect(() => {
    const onAppError = (event) => {
      setModalState({
        open: true,
        title: event.detail?.title || "Error",
        message:
          event.detail?.message || "Something went wrong. Please try again.",
      });
    };

    window.addEventListener("app:error", onAppError);
    return () => window.removeEventListener("app:error", onAppError);
  }, []);

  return (
    <div className="App">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SeoManager />

      <div id="main-content" ref={mainRef} role="main" tabIndex={-1}>
        <Suspense
          fallback={
            <LoadingScreen
              title="Loading Athena Nexus"
              message="Streaming in the next screen so you can keep moving."
            />
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/milestones" element={<Milestones />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/gallery/:weekId" element={<Gallery />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route path="/submit" element={<Submit />} />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>

      <FeedbackButton />
      <MiniModal
        open={modalState.open}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
      />
      <WelcomeModal open={showWelcome} onClose={() => setShowWelcome(false)} />
      <CookieConsent />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
