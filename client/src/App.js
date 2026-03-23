import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import { fetchMe } from "./redux/thunks/authThunks";
import { selectTheme } from "./redux/selectors/themeSelectors";
import { selectAuthToken, selectUser } from "./redux/selectors/authSelectors";

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
import MiniModal from "./components/MiniModal";

import "./App.css";

function App() {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const token = useSelector(selectAuthToken);
  const user = useSelector(selectUser);
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
    if (token && !user) {
      dispatch(fetchMe());
    }
  }, [token, user, dispatch]);

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
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/milestones" element={<Milestones />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/gallery/:weekId" element={<Gallery />} />
          <Route path="/about" element={<About />} />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <MiniModal
          open={modalState.open}
          title={modalState.title}
          message={modalState.message}
          onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
        />
      </div>
    </Router>
  );
}

export default App;
