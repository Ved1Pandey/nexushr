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
      const res = await fetch("http://localhost:3001/api/leaves", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 🔥 AUTO LOGOUT ON TOKEN FAIL
      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        navigate("/");
        return;
      }

      if (!res.ok) {
        console.error("FETCH FAILED:", res.status);
        return;
      }

      const data = await res.json();
      setLeaves(data);

    } catch (err) {
      console.error("FETCH ERROR:", err);
    }
  };

  // ==============================
  // UPDATE STATUS
  // ==============================
  const updateStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(
        `http://localhost:3001/api/leaves/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!res.ok) {
        alert("Update failed ❌");
        return;
      }

      fetchLeaves(token);

    } catch (err) {
      console.error("UPDATE ERROR:", err);
    }
  };

  // ==============================
  // INIT
  // ==============================
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      navigate("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchLeaves(token);
    } catch (err) {
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
        alert("Apply failed ❌");
        return;
      }

      alert("Leave Applied ✅");

      fetchLeaves(token);

      setFromDate("");
      setToDate("");
      setReason("");

    } catch (err) {
      console.error("APPLY ERROR:", err);
    }
  };

  // ==============================
  if (loading) return <h2>Loading...</h2>;

  // ==============================
  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome {user?.name}</h2>
      <p>Role: {user?.role}</p>

      {/* APPLY LEAVE */}
      <h3>Apply Leave</h3>

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

      {/* LEAVES LIST */}
      <h3>Leaves Data:</h3>

      {leaves.length === 0 ? (
        <p>No leaves found</p>
      ) : (
        leaves.map((leave) => (
          <div
            key={leave.id}
            style={{
              border: "1px solid gray",
              margin: 10,
              padding: 10,
            }}
          >
            <p><b>From:</b> {leave.from_date}</p>
            <p><b>To:</b> {leave.to_date}</p>
            <p><b>Reason:</b> {leave.reason}</p>
            <p><b>Status:</b> {leave.status}</p>
{/* IMPORTANT FIX (ROLE SAFE CHECK) */}
            {user?.role?.toLowerCase() === "team lead" && (
              <>
                <button
                  onClick={() => updateStatus(leave.id, "APPROVED")}
                >
                  Approve
                </button>

                <button
                  onClick={() => updateStatus(leave.id, "REJECTED")}
                >
                  Reject
                </button>
              </>
            )}
          </div>
        ))
      )}
{/* LOGOUT */}
      <button
        onClick={() => {
          localStorage.clear();
          navigate("/");
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
