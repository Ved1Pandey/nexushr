import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<any[]>([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  const navigate = useNavigate();

  // ==============================
  // FETCH LEAVES
  // ==============================
  const fetchLeaves = async (token: string) => {
    try {
      console.log("TOKEN SENT:", token);

      const res = await fetch("http://localhost:3001/api/leaves", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("FETCH FAILED:", res.status);
        return;
      }

      const data = await res.json();
      console.log("LEAVES:", data);

      setLeaves(data);

    } catch (err) {
      console.error("FETCH ERROR:", err);
    }
  };

  // ==============================
  // INIT
  // ==============================
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      console.log("NO AUTH ❌");
      navigate("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      fetchLeaves(token); // 🔥 correct call

    } catch (err) {
      console.log("USER PARSE ERROR");
      navigate("/");
    }

    setLoading(false);
  }, []);

  // ==============================
  // APPLY LEAVE
  // ==============================
  const handleApplyLeave = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    if (!fromDate || !toDate || !reason) {
      alert("Fill all fields ❌");
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/api/leaves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from_date: fromDate,
          to_date: toDate,
          reason,
        }),
      });

      if (!res.ok) {
        console.error("APPLY FAILED:", res.status);
        alert("Apply failed ❌");
        return;
      }

      alert("Leave Applied ✅");

      // 🔥 refresh data
      fetchLeaves(token);

      // reset form
      setFromDate("");
      setToDate("");
      setReason("");

    } catch (err) {
      console.error("APPLY ERROR:", err);
    }
  };

  // ==============================
  // LOADING
  // ==============================
  if (loading) return <h2>Loading...</h2>;

  // ==============================
  // UI
  // ==============================
  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome {user?.name}</h2>
      <p>Role: {user?.role}</p>

      <h3>Apply Leave</h3>

      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
      />
      <br /><br />

      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <br /><br />

      <button onClick={handleApplyLeave}>
        Apply Leave
      </button>

      <h3>Leaves Data:</h3>

      {leaves.length === 0 ? (
        <p>No leaves found</p>
      ) : (
        <pre>{JSON.stringify(leaves, null, 2)}</pre>
      )}

      <button
        onClick={() => {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          navigate("/");
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
