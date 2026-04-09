import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null); // ✅ NEW

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

      if (res.status === 401 || res.status === 403) {
        sessionStorage.clear();
        navigate("/");
        return;
      }

      const data = await res.json();

      const unique = Array.from(
        new Map(data.map((i: any) => [i.id, i])).values()
      );

      setLeaves(unique);

    } catch (err) {
      console.error(err);
    }
  };

  // ==============================
  // FETCH BALANCE ✅ NEW
  // ==============================
  const fetchBalance = async (token: string) => {
    try {
      const res = await fetch("http://localhost:3001/api/leave-balance", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

    if (!res.ok) {
      alert("Update failed ❌");
      return;
    }

    fetchLeaves(token);
    fetchBalance(token); // ✅ refresh balance
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
    fetchBalance(token); // ✅ ADD
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

  // ==============================
  // ROLE CHECK
  // ==============================
  const isApprover = ["team lead", "manager"].includes(
    user?.role?.toLowerCase()
  );

  // ==============================
  // SPLIT LEAVES
  // ==============================
  const myLeaves = leaves.filter(l => l.employee_id === user?.id);
  const teamLeaves = leaves.filter(l => l.employee_id !== user?.id);

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome {user?.name}</h2>
      <p>Role: {user?.role}</p>

      {/* ✅ LEAVE BALANCE */}
      <h3>Leave Balance</h3>
      {balance ? (
        <div style={{ marginBottom: 20 }}>
          <p>CL: {balance.CL}</p>
          <p>SL: {balance.SL}</p>
          <p>PL: {balance.PL}</p>
        </div>
      ) : (
        <p>Loading balance...</p>
      )}

      {/* APPLY LEAVE */}
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
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason"
      />
      <br /><br />

      <button onClick={handleApplyLeave}>Apply</button>

      {/* MY LEAVES */}
      <h3>My Leaves</h3>

      {myLeaves.length === 0 ? (
        <p>No leaves</p>
      ) : (
        myLeaves.map((l) => (
          <div key={l.id} style={{ border: "1px solid #ccc", margin: 10, padding: 12 }}>
            <p><b>From:</b> {l.from_date}</p>
            <p><b>To:</b> {l.to_date}</p>
            <p><b>Reason:</b> {l.reason}</p>
            <p><b>Status:</b> {l.status}</p>
          </div>
        ))
      )}

      {/* TEAM LEAVES */}
      {isApprover && (
        <>
          <h3>Team Leaves (For Approval)</h3>

          {teamLeaves.length === 0 ? (
            <p>No team leaves</p>
          ) : (
            teamLeaves.map((l) => (
              <div
                key={l.id}
                style={{
                  border: "1px solid #ccc",
                  margin: 10,
                  padding: 12,
                  borderRadius: 8,
                  background: "#f9f9f9"
                }}
              >
                <p><b>Employee:</b> {l.employees?.name || "-"}</p>

                <p><b>From:</b> {l.from_date}</p>
                <p><b>To:</b> {l.to_date}</p>
                <p><b>Reason:</b> {l.reason}</p>

                <p>
                  <b>Status:</b>{" "}
                  <span
                    style={{
                      color:
                        l.status === "APPROVED"
                          ? "green"
                          : l.status === "REJECTED"
                          ? "red"
                          : "orange",
                    }}
                  >
                    {l.status}
                  </span>
                </p>

                {l.status === "PENDING" &&
                  l.employee_id !== user?.id && (
                    <>
                      <button
                        onClick={() => updateStatus(l.id, "APPROVED")}
                        style={{ marginRight: 10 }}
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => updateStatus(l.id, "REJECTED")}
                      >
                        Reject
                      </button>
                    </>
                  )}
              </div>
            ))
          )}
        </>
      )}

{/* LOGOUT */}
      <button
        onClick={() => {
          sessionStorage.clear();
          navigate("/");
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
