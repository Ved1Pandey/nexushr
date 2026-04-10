import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState("CL");

  const [submitting, setSubmitting] = useState(false); // ✅ prevent spam

  const navigate = useNavigate();

  // ==============================
  // FETCH LEAVES
  // ==============================
  const fetchLeaves = async (token: string) => {
    try {
      const res = await fetch("http://localhost:3001/api/leaves", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        sessionStorage.clear();
        navigate("/");
        return;
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("Leaves API error:", data);
        setLeaves([]);
        return;
      }

      setLeaves(data);

    } catch (err) {
      console.error("Fetch leaves error:", err);
    }
  };

  // ==============================
  // FETCH BALANCE
  // ==============================
  const fetchBalance = async (token: string) => {
    try {
      const res = await fetch("http://localhost:3001/api/leave-balance", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setBalance(data);

    } catch (err) {
      console.error(err);
    }
  };

  // ==============================
  // UPDATE STATUS
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

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Update failed ❌");
      return;
    }

    fetchLeaves(token);
    fetchBalance(token);
  };

  // ==============================
  // INIT
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
    fetchBalance(token);
    setLoading(false);
  }, []);

  // ==============================
  // APPLY LEAVE
  // ==============================
  const handleApplyLeave = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    if (!fromDate || !toDate || !reason) {
      alert("Fill all fields ❌");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      alert("Invalid date range ❌");
      return;
    }

    try {
      setSubmitting(true); // ✅ disable button

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
          type,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Apply failed ❌");
        setSubmitting(false);
        return;
      }

      // ✅ refresh
      await fetchLeaves(token);
      await fetchBalance(token);

      // reset
      setFromDate("");
      setToDate("");
      setReason("");
      setType("CL");

    } catch (err) {
      console.error(err);
      alert("Something went wrong ❌");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <h2>Loading...</h2>;

  const isApprover = ["team lead", "manager"].includes(
    user?.role?.toLowerCase()
  );

  const myLeaves = leaves.filter(l => l.employee_id === user?.id);
  const teamLeaves = leaves.filter(l => l.employee_id !== user?.id);

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      
      <h2>Welcome {user?.name}</h2>
      <p>Role: {user?.role}</p>

      {/* BALANCE */}
      <h3>Leave Balance</h3>
      {balance ? (
        <>
          <p>CL: {balance.CL}</p>
          <p>SL: {balance.SL}</p>
          <p>PL: {balance.PL}</p>
        </>
      ) : <p>Loading...</p>}

      {/* APPLY */}
      <h3>Apply Leave</h3>

      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="CL">CL</option>
        <option value="SL">SL</option>
        <option value="PL">PL</option>
      </select>

      <br /><br />

      <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
      <br /><br />

      <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
      <br /><br />

      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason"
      />

      <br /><br />

      <button onClick={handleApplyLeave} disabled={submitting}>
        {submitting ? "Applying..." : "Apply"}
      </button>

      {/* MY LEAVES */}
      <h3>My Leaves</h3>

      {myLeaves.length === 0 ? (
        <p>No leaves</p>
      ) : (
        myLeaves.map((l) => (
          <div key={l.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
            <p><b>Type:</b> {l.type}</p>
            <p>{l.from_date} → {l.to_date}</p>
            <p>
              Status:{" "}
              <span style={{
                color:
                  l.status === "APPROVED"
                    ? "green"
                    : l.status === "REJECTED"
                    ? "red"
                    : "orange"
              }}>
                {l.status}
              </span>
            </p>
          </div>
        ))
      )}

      {/* TEAM */}
      {isApprover && (
        <>
          <h3>Team Leaves</h3>

          {teamLeaves.map((l) => (
            <div key={l.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
              <p><b>{l.employees?.name}</b></p>
              <p>{l.from_date} → {l.to_date}</p>
              <p>Status: {l.status}</p>

              {l.status === "PENDING" && (
                <>
                  <button onClick={() => updateStatus(l.id, "APPROVED")}>
                    Approve
                  </button>
                  <button onClick={() => updateStatus(l.id, "REJECTED")}>
                    Reject
                  </button>
                </>
              )}
            </div>
          ))}
        </>
      )}

      <br />
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