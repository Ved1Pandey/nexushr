 import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ✅ already logged in → redirect ONCE only
 useEffect(() => {
  const token = sessionStorage.getItem("token");
  const user = sessionStorage.getItem("user");

  if (token && user) {
    const parsedUser = JSON.parse(user);

    if (parsedUser.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/", { replace: true });
  }
}
},[navigate]);

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
        email: email.trim().toLowerCase(),
        password: password.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Login failed ❌");
      return;
    }

    if (!data.token || !data.user) {
      setError("Invalid response ❌");
      return;
    }

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));

    const role = data.user.role;

if (role.toLowerCase() === "admin") {
  navigate("/admin", { replace: true });
} else {
  navigate("/", { replace: true });
}


  } catch (err) {
    console.error(err);
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

    <button
      onClick={() => {
        console.log("LOGIN CLICKED");
        handleLogin();
      }}
      disabled={loading}
    >
      {loading ? "Logging in..." : "Login"}
    </button>
  </div>
);
};

export default Login; 