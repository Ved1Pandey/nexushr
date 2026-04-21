import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type LeaveType = "CL" | "SL" | "PL";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]); // ✅ NEW
  const [balance, setBalance] = useState<any>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState<LeaveType>("CL");

  const [submitting, setSubmitting] = useState(false);
  const [punchLoading, setPunchLoading] = useState(false);

  const navigate = useNavigate();

  // ==============================
  // SAFE FETCH
  // ==============================
const BASE_URL = "http://localhost:3001/api";

const safeFetch = async (endpoint: string, options: any = {}) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, options);

  let data = {};
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    throw new Error((data as any).error || "Something failed");
  }

  return data;
};
  // ==============================
  // FETCH LEAVES
  // ==============================
const fetchLeaves = async (token: string, user: any) => {
  let allLeaves: any[] = [];

  // 👉 1. OWN LEAVES (सबके लिए)
  const own: any = await safeFetch("/leaves", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (Array.isArray(own)) {
    allLeaves = [...own];
  }

  // 👉 2. TEAM LEAVES (only TL / Manager)
  if (
    user?.role?.toLowerCase() === "team lead" ||
    user?.role?.toLowerCase() === "manager"
  ) {
const team: any = await safeFetch("/team-leaves", {
  headers: { Authorization: `Bearer ${token}` },
});
console.log("TEAM LEAVES:", team);

    if (Array.isArray(team)) {
      allLeaves = [...allLeaves, ...team];
    }
  }

  // 👉 sort latest first
  const sorted = allLeaves.sort(
    (a, b) =>
      new Date(b.from_date).getTime() -
      new Date(a.from_date).getTime()
  );

  setLeaves(sorted);
};

  // ==============================
  // FETCH BALANCE
  // ==============================
const fetchBalance = async (token: string) => {
  try {
    const data = await safeFetch("/leave-balance", {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("BALANCE API RESPONSE:", data); // 👈 ADD THIS

    setBalance(data);
  } catch (err) {
    console.log("BALANCE ERROR:", err); // 👈 ADD THIS
  }
};

  // ==============================
  // FETCH ATTENDANCE ✅ NEW
  // ==============================
  const fetchAttendance = async (token: string) => {
      const data: any = await safeFetch("/attendance", {
      headers: { Authorization: `Bearer ${token}` },
    });

    setAttendance(Array.isArray(data) ? data : []);
  };

  // ==============================
  // PUNCH IN
  // ==============================
  
  const handlePunchIn = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    try {
      setPunchLoading(true);

      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );

      const { latitude, longitude } = position.coords;

      await safeFetch("/punch-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      alert("Punch In success ✅");

      await fetchAttendance(token); // refresh

    } catch (err: any) {
      alert(err.message);
    } finally {
      setPunchLoading(false);
    }
  };

  // ==============================
  // PUNCH OUT
  // ==============================
  const handlePunchOut = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    try {
      setPunchLoading(true);

      await safeFetch("/punch-out", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Punch Out success ✅");

      await fetchAttendance(token);

    } catch (err: any) {
      alert(err.message);
    } finally {
      setPunchLoading(false);
    }
  };

  // ==============================
  // APPLY LEAVE
  // ==============================
  const handleApplyLeave = async () => {
    const token = sessionStorage.getItem("token")||"";

    if (!token) return;

    if (!fromDate || !toDate || !reason) {
      alert("Fill all fields ❌");
      return;
    }

    try {
      setSubmitting(true);

      const res: any = await safeFetch("/leaves", {
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

if (res && res.success) {
  alert("Leave applied successfully ✅");
}


      await fetchLeaves(token, user);
      console.log("REFRESH DONE");
      await fetchBalance(token);

      setFromDate("");
      setToDate("");
      setReason("");
      setType("CL");

    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };
const handleAction = async (id: number, status: string) => {
const token: string = sessionStorage.getItem("token")||"";
  try {
    await safeFetch(`/leaves/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    await fetchLeaves(token, user);
    await fetchBalance(token);
  } catch (err) {
    alert("Error updating status");
  }
};
  // ==============================
  // INIT
  // ==============================
useEffect(() => {
  const userStr = sessionStorage.getItem("user");
  const token = sessionStorage.getItem("token");

  if (!userStr || !token) {
    navigate("/");
    return;
  }

  const parsedUser = JSON.parse(userStr);
  setUser(parsedUser);

}, []);

useEffect(() => {
  const token = sessionStorage.getItem("token");
  if (!user || !token) return;

  fetchLeaves(token, user);
  fetchBalance(token);
  fetchAttendance(token);

  setLoading(false); 
},
 [user]); 



  if (loading) return <h2>Loading...</h2>;
  
console.log("BALANCE STATE:", balance);
console.log("USER:", user);
console.log("LEAVES:", leaves);
console.log("BALANCE API:",balance);
const role = user?.role?.toLowerCase();

const isTL = role === "team lead";
const isManager = role === "manager";

// 🔹 MY OWN LEAVES (correct)
const myOwnLeaves = leaves.filter(
  (l) => String(l.employee_id) === String(user?.id)
);

// 🔹 TEAM LEAVES (ONLY others)
const teamLeaves = leaves.filter(
  (l) => String(l.employee_id) !== String(user?.id)
);
  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome {user?.name}</h2>

      {/* 🔥 ATTENDANCE */}
      <h3>Attendance</h3>
      <button onClick={handlePunchIn} disabled={punchLoading}>
        Punch In
      </button>

      <button onClick={handlePunchOut} disabled={punchLoading}>
        Punch Out
      </button>
      {/* ✅ ATTENDANCE LIST */}
      <h3>My Attendance</h3>
      {attendance.map((a:any) => (
        <div key={a.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <p>Punch In: {new Date(a.punch_in).toLocaleString()}</p>
          <p>Punch Out: {a.punch_out ? new Date(a.punch_out).toLocaleString() : "—"}</p>

          {/* 🔥 GOOGLE MAP */}
          <a
            href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
            target="_blank"
          >
            View Location 📍
          </a>
        </div>
      ))}

      {/* BALANCE */}
      <h3>Leave Balance</h3>
      {balance && (
        <>
          <p>CL: {balance.CL}</p>
          <p>SL: {balance.SL}</p>
          <p>PL: {balance.PL}</p>
        </>
      )}

      {/* APPLY */}
      <h3>Apply Leave</h3>

      <select value={type} onChange={(e) => setType(e.target.value as LeaveType)}>
        <option value="CL">CL</option>
        <option value="SL">SL</option>
        <option value="PL">PL</option>
      </select>

      <br /><br />

      <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
      <br /><br />

      <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
      <br /><br />

      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
      <br /><br />

      <button onClick={handleApplyLeave} disabled={submitting}>
        {submitting ? "Applying..." : "Apply"}
      </button>

{/* ================= MY LEAVES ================= */}
<h3>My Leaves</h3>

{myOwnLeaves.map((l) => (
  <div key={l.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
    <b>Me</b>
    <br />

    Type: {l.type} | Status: {l.status}
    <br />

    {l.from_date === l.to_date ? (
      <p>Date: {new Date(l.from_date).toLocaleDateString()}</p>
    ) : (
      <>
        <p>From: {new Date(l.from_date).toLocaleDateString()}</p>
        <p>To: {new Date(l.to_date).toLocaleDateString()}</p>
      </>
    )}

    <p>Reason: {l.reason}</p>
  </div>
))}

{/* ================= TEAM LEAVES ================= */}
{(isTL || isManager) && (
  <>
    <h3>Team Leaves</h3>

    {teamLeaves.map((l) => (
      <div key={l.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
        
        <b>{l.employees?.name}</b>
        <br />

        Type: {l.type} | Status: {l.status}
        <br />

        {l.from_date === l.to_date ? (
          <p>Date: {new Date(l.from_date).toLocaleDateString()}</p>
        ) : (
          <>
            <p>From: {new Date(l.from_date).toLocaleDateString()}</p>
            <p>To: {new Date(l.to_date).toLocaleDateString()}</p>
          </>
        )}

        <p>Reason: {l.reason}</p>

        <br />

        {l.status?.toUpperCase() === "PENDING" &&
          String(l.employee_id) !== String(user?.id) && (
            <>
              <button onClick={() => handleAction(l.id, "APPROVED")}>
                Approve
              </button>

              <button onClick={() => handleAction(l.id, "REJECTED")}>
                Reject
              </button>
            </>
        )}

      </div>
    ))}

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
