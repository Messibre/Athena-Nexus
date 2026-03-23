import React, { useEffect, useState } from "react";
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

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Submit from "./pages/Submit";
import Settings from "./pages/Settings";
import Challenges from "./pages/Challenges";
import Gallery from "./pages/Gallery";
import AdminPanel from "./pages/AdminPanel";
import About from "./pages/About";
import Milestones from "./pages/Milestones";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import MiniModal from "./components/MiniModal";
import CookieConsent from "./components/CookieConsent";
import SeoManager from "./components/SeoManager";

import "./App.css";

const LAST_ROUTE_KEY = "lastRoute.v1";

function AppContent() {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const user = useSelector(selectUser);
  const location = useLocation();
  const [modalState, setModalState] = useState({
    open: false,
    title: "Error",
    message: "",
  });

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
      <SeoManager />

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
        <Route
          path="/submit"
          element={
            <PrivateRoute>
              <Submit />
            </PrivateRoute>
          }
        />
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

      <MiniModal
        open={modalState.open}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
      />
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
