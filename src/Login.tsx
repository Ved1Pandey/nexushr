import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 text-white items-center justify-center p-16">
  <div>
    <h1 className="text-5xl font-bold">NexusHR</h1>

    <p className="mt-4 text-xl">
      Smart HR Management System
    </p>

    <div className="mt-10 space-y-4 text-lg">
      <p>✔ Employee Management</p>
      <p>✔ Attendance Tracking</p>
      <p>✔ Leave Management</p>
      <p>✔ Payroll</p>
    </div>
  </div>
</div>
<div className="flex w-full lg:w-1/2 items-center justify-center bg-gray-50 px-6">
<div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-md border border-orange-100">
      
      <div className="w-16 h-1 bg-orange-500 rounded-full mb-6"></div>

<h2 className="text-3xl font-bold text-gray-800">
  Welcome Back 👋
</h2>


<p className="text-gray-500 mb-8">
Sign in to continue to NexusHR
</p>


      {error && (
  <div className="mb-4 rounded-lg bg-red-100 border border-red-300 text-red-700 px-4 py-3">
    {error}
  </div>
)}<input
  type="email"
  placeholder="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-5 focus:outline-none focus:ring-2 focus:ring-orange-500"
/>

      
<div className="relative mb-5">

<input
  type={showPassword ? "text" : "password"}
  placeholder="Password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500"
/>

<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
>
  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
</button>

</div>
      <button
  onClick={handleLogin}
  disabled={loading}
  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50"
>
  {loading ? "Logging in..." : "Sign In"}
</button>
<button
  onClick={handleSignup}
  className="w-full mt-3 border-2 border-orange-500 text-orange-500 font-semibold py-3 rounded-xl hover:bg-orange-50 transition duration-200"
>
  Sign Up
</button>
<button
  onClick={() => navigate("/forgot-password")}
  className="mt-4 w-full text-center text-orange-600 font-medium hover:text-orange-700 hover:underline transition"
>
  Forgot Password?
</button>
    </div>
</div>
</div>
  );
};

export default Login;