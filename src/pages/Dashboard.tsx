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
    // FETCH LEAVES ✅ FIXED
  // ==============================
  const fetchLeaves = async (token: string) => {
    try {
      const res = await fetch("http://localhost:3001/api/leaves", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
if (res.status === 401 || res.status === 403) {
        sessionStorage.clear();
        navigate("/");
        return;
      }
      const data = await res.json();

      // ✅ DEDUPE ONLY (NO MUTATION)
      const unique = Array.from(
        new Map(data.map((i: any) => [i.id, i])).values()
      );

      setLeaves(unique);

    } catch (err) {
      console.error(err);
    }
  };// ==============================
  // UPDATE STATUS ✅ FIXED
  // ==============================
  const updateStatus = async (id: number, status: string) => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

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
  };

  // ==============================
  // INIT ✅ FIXED (sessionStorage)
  // ==============================
  useEffect(() => {
    const user = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("token");

    if (!user || !token) {
      navigate("/");
      return;
    }

    setUser(JSON.parse(user));
    fetchLeaves(token);
    setLoading(false);
  }, []);

  // ==============================
  // APPLY LEAVE
  // ==============================
  const handleApplyLeave = async () => {
    const token = sessionStorage.getItem("token");

    if (!fromDate || !toDate || !reason) {
      alert("Fill all fields ❌");
      return;
    }

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

    fetchLeaves(token!);
    setFromDate("");
    setToDate("");
    setReason("");
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome {user?.name}</h2>
      <p>Role: {user?.role}</p>

      <h3>Apply Leave</h3>

      <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
      <br /><br />

      <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
      <br /><br />

      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
      <br /><br />

      <button onClick={handleApplyLeave}>Apply</button>

      <h3>Leaves</h3>

      {leaves.map((l) => (
        <div key={l.id} style={{ border: "1px solid", margin: 10, padding: 10 }}>
          <p>{l.from_date} → {l.to_date}</p>
          <p>{l.reason}</p>
          <p>{l.status}</p>

          {/* ✅ FIX ROLE CHECK */}
          {l.status === "PENDING" &&
            ["team lead", "manager"].includes(user?.role?.toLowerCase()) && (
              <>
                <button onClick={() => updateStatus(l.id, "APPROVED")}>Approve</button>
                <button onClick={() => updateStatus(l.id, "REJECTED")}>Reject</button>
              </>
            )}
        </div>
      ))}

      <button onClick={() => {
        sessionStorage.clear();
        navigate("/");
      }}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;