import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../redux/thunks/authThunks";
import Navbar from "../components/Navbar";
import { selectAuthActionLoading } from "../redux/selectors/authSelectors";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const actionLoading = useSelector(selectAuthActionLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await dispatch(login({ username, password })).unwrap();
      navigate("/dashboard");
    } catch (err) {
      setError(err || "Login failed");
    }
  };

  return (
    <>
      <Navbar />
      <div
        className="container"
        style={{ maxWidth: "400px", marginTop: "60px" }}
      >
        <div className="card">
          <h2
            className="card-title"
            style={{ marginBottom: "24px", textAlign: "center" }}
          >
            Login to Your Account
          </h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "8px" }}
              disabled={actionLoading}
            >
              {actionLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div
            style={{
              marginTop: "24px",
              textAlign: "center",
              paddingTop: "24px",
              borderTop: "1px solid var(--border-color)",
            }}
          >
            <p style={{ color: "var(--text-secondary)" }}>
              Don't have an account?{" "}
              <Link
                to="/signup"
                style={{ color: "var(--primary)", fontWeight: "600" }}
              >
                Register your team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
