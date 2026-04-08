import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ✅ already logged in → go dashboard (FIXED)
  useEffect(() => {
    const token = sessionStorage.getItem("token"); // 🔥 CHANGE
    if (token && token !== "undefined") {
      navigate("/dashboard");
    }
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed ❌");
        return;
      }

      if (!data.token) {
        setError("Token missing ❌");
        return;
      }

      // 🔥 CRITICAL FIX (TAB ISOLATION)
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      alert("Login Success ✅");

      navigate("/dashboard");

    } catch (err) {
      console.error("Login error:", err);
      setError("Server error ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </div>
  );
};

export default Login;
