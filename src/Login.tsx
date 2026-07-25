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
  const userStr = sessionStorage.getItem("user");

  if (!token || !userStr) return;

  const user = JSON.parse(userStr);

const role = String(user.role).toLowerCase();

if (role === "admin") {
  navigate("/admin-dashboard", { replace: true });
}
else if (role === "manager") {
  navigate("/dashboard", { replace: true });
}
else {
  navigate("/dashboard", { replace: true });
}


}, [navigate]); 

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Enter email & password ❌");
      return;
    }

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
      console.log("LOGIN DATA:", data);
      if (!res.ok) {
        setError(data.error || "Login failed ❌");
        return;
      }

      if (!data.token || !data.user) {
        setError("Invalid response ❌");
        return;
      }

      // ✅ save session
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      // ❌ alert hata (loop cause karta kabhi kabhi)
      // alert("Login Success ✅");

      // ✅ single navigation
      console.log("ROLE:", data.user.role);
console.log("USER:", data.user);
const role = String(data.user.role).toLowerCase();

if (role === "admin") {
  navigate("/admin-dashboard", { replace: true });
}
else if (role === "manager") {
  navigate("/dashboard", { replace: true });
}
else {
  navigate("/dashboard", { replace: true });
}

    } catch (err) {
      console.error(err);
      setError("Server error ❌");
    } finally {
      setLoading(false);
    }
  };
  const handleSignup = async () => {
  try {
    const res = await fetch("http://localhost:3001/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Signup failed ❌");
      return;
    }

    alert("Signup success ✅");

    navigate("/career");

  } catch (err) {
    console.error(err);
    alert("Server error ❌");
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
      <button onClick={handleSignup}>
      Sign Up
   </button>
   <br /><br />

<button onClick={() => navigate("/forgot-password")}>
  Forgot Password?
</button>
    </div>
  );
};

export default Login;