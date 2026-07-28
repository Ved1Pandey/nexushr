import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const sendOtp = async () => {
    const res = await fetch("http://localhost:3001/api/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setMessage(data.message);

    if (res.ok) {
      setStep(2);
    }
  };

  const verifyOtp = async () => {
    const res = await fetch("http://localhost:3001/api/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        otp,
      }),
    });

    const data = await res.json();
    setMessage(data.message);

    if (res.ok) {
      setStep(3);
    }
  };

  const resetPassword = async () => {
    const res = await fetch("http://localhost:3001/api/reset-password", {
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
    setMessage(data.message);

    if (res.ok) {
      alert("Password Reset Successfully");
      navigate("/");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Forgot Password</h2>

      <p>{message}</p>

      {step === 1 && (
        <>
          <input
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />
          <br />
          <button onClick={sendOtp}>Send OTP</button>
        </>
      )}

      {step === 2 && (
        <>
          <input
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <br />
          <br />
          <button onClick={verifyOtp}>Verify OTP</button>
        </>
      )}

      {step === 3 && (
        <>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />
          <br />
          <button onClick={resetPassword}>
            Reset Password
          </button>
        </>
      )}
    </div>
  );
};

export default ForgotPassword;
//VedPandey