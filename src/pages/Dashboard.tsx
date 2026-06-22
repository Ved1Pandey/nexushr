import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Attendance = {
  id: number;
  punch_in: string;
  punch_out?: string;
  latitude?: number;
  longitude?: number;
};

type LeaveType = "CL" | "SL" | "PL";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]); // ✅ NEW
  const [balance, setBalance] = useState<any>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState<LeaveType>("CL");
  const [submitting, setSubmitting] = useState(false);
  const [punchLoading, setPunchLoading] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  
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

  const own: any = await safeFetch("/leaves", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (Array.isArray(own)) {
    allLeaves = [...own];
  }

  if (
    user?.role?.toLowerCase() === "team lead" ||
    user?.role?.toLowerCase() === "manager"
  ) {
    const team: any = await safeFetch("/team-leaves", {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("TEAM LEAVES:", team);

    if (Array.isArray(team)) {
      const merged = [...allLeaves, ...team];

      const uniqueLeaves = merged.filter(
        (leave, index, self) =>
          index === self.findIndex(
            (l) => l.id === leave.id
          )
      );

      allLeaves = uniqueLeaves;
    }
  }

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
const myPending = myOwnLeaves.filter(l => l.status === "PENDING").length;
const myApproved = myOwnLeaves.filter(l => l.status === "APPROVED").length;
const myRejected = myOwnLeaves.filter(l => l.status === "REJECTED").length;
const pendingCount = teamLeaves.filter(
  (l) => l.status?.toLowerCase() === "pending"
).length;

const approvedCount = teamLeaves.filter(
  (l) => l.status?.toLowerCase() === "approved"
).length;

const rejectedCount = teamLeaves.filter(

  (l) => l.status?.toLowerCase() === "rejected"
).length;

const today = new Date().toDateString();

const todayRecord = attendance
  .filter((a: Attendance) => 
    new Date(a.punch_in).toDateString() === today
  )
  .sort(
    (a: Attendance, b: Attendance) =>
      new Date(b.punch_in).getTime() -
      new Date(a.punch_in).getTime()
  )[0] as Attendance | undefined;


let todayStatus = "Absent";

if (todayRecord?.punch_in) {
  if (todayRecord.punch_out) {
    todayStatus = "Present";
  } else {
    todayStatus = "In Progress";
  }
}

return (
  
<div
  style={{
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "40px",
  }}
>
  <div
    style={{
      background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
      color: "white",
      padding: "30px",
      borderRadius: "20px",
      marginBottom: "30px",
      boxShadow: "0 10px 30px rgba(37,99,235,0.25)",
    }}
  >
    <h1 style={{ margin: 0 }}>Welcome, {user?.name}</h1>

    <p
      style={{
        marginTop: 10,
        fontSize: 18,
        opacity: 0.95,
      }}
    >
      Today's Status: {todayStatus}
    </p>
  </div>

{(isTL || isManager) && (
  <>
  <div
    style={{
      background: "white",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "20px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
    }}
  >
    <h3 style={{ marginTop: 0 }}>Team Summary</h3>

    <div
      style={{
        display: "flex",
        gap: "20px",
        justifyContent: "space-around",
      }}
    ></div>
  
  <div style={{ background: "white",
padding: "24px",
borderRadius: "16px",
textAlign: "center",
boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
border: "none"
 }}>
    <h2>{pendingCount}</h2>
    <p>Pending</p>
  </div>

  <div style={{ background: "white",
padding: "24px",
borderRadius: "16px",
textAlign: "center",
boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
border: "none"
 }}>
    <h2>{approvedCount}</h2>
    <p>Approved</p>
  </div>

  <div style={{ background: "white",
padding: "24px",
borderRadius: "16px",
textAlign: "center",
boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
border: "none"
 }}>
    <h2>{rejectedCount}</h2>
    <p>Rejected</p>
  </div>

</div>

  </>
)}



<div
  style={{
    background: "white",
    borderRadius: "12px",
    padding: "16px 24px",
    marginBottom: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    textAlign: "center",
  }}
>
  <h3 style={{ margin: 0 }}>My Leave Summary</h3>

  <p
    style={{
      marginTop: "10px",
      fontSize: "16px",
      fontWeight: 600,
    }}
  >
    Pending: {myPending} | Approved: {myApproved} | Rejected: {myRejected}
  </p>
</div>

</div> {/* 👈 My Leaves cards ka end */}
<div style={{ textAlign: "center", marginBottom: 20 }}>
  <button
    onClick={() => setShowAttendance(!showAttendance)}
    style={{
      background: "#2563eb",
      color: "white",
      padding: "10px 20px",
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
      marginTop: 10
    }}
  >
    {showAttendance ? "Hide Attendance" : "View Attendance"}
  </button>
</div>

      {/* 🔥 ATTENDANCE */}
      {showAttendance && (
  <>
    <h3>Attendance</h3>

    <button onClick={handlePunchIn} disabled={punchLoading}>
      Punch In
    </button>

    <button onClick={handlePunchOut} disabled={punchLoading}>
      Punch Out
    </button>

    <h3>My Attendance</h3>

    {attendance.map((a: Attendance) => (
      <div
        key={a.id}
        style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}
      >
        <p>Punch In: {new Date(a.punch_in).toLocaleString()}</p>
        <p>
          Punch Out:{" "}
          {a.punch_out
            ? new Date(a.punch_out).toLocaleString()
            : "—"}
        </p>

        <a
          href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
          target="_blank"
        >
          View Location 📍
        </a>
      </div>
    ))}
  </>
)}


      {/* BALANCE */}
<div
  style={{
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    marginTop: "20px",
    marginBottom: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  }}
>
  <h3 style={{ marginTop: 0 }}>Leave Balance</h3>
  

  <div
    style={{
      display: "flex",
      gap: "20px",
      justifyContent: "center",
      flexWrap: "wrap",
    }}
  >
    <div
      style={{
        background: "#eff6ff",
        padding: "20px",
        borderRadius: "12px",
        minWidth: "120px",
        textAlign: "center",
      }}
    >
      <h2>{balance?.CL ?? 0}</h2>
      <p>CL</p>
    </div>

    <div
      style={{
        background: "#f0fdf4",
        padding: "20px",
        borderRadius: "12px",
        minWidth: "120px",
        textAlign: "center",
      }}
    >
      <h2>{balance?.SL ?? 0}</h2>
      <p>SL</p>
    </div>

    <div
      style={{
        background: "#fefce8",
        padding: "20px",
        borderRadius: "12px",
        minWidth: "120px",
        textAlign: "center",
      }}
    >
      <h2>{balance?.PL ?? 0}</h2>
      <p>PL</p>
    </div>
  </div>
</div>
<div
  style={{
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    marginTop: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    maxWidth: "500px",
    marginLeft: "auto",
    marginRight: "auto",
  }}
>
  <h3 style={{ marginTop: 0 }}>Apply Leave</h3>

<select
  value={type}
  onChange={(e) => setType(e.target.value as LeaveType)}
>
  <option value="CL">CL</option>
  <option value="SL">SL</option>
  <option value="PL">PL</option>
</select>

<br /><br />

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

<button onClick={handleApplyLeave} disabled={submitting}>
  {submitting ? "Applying..." : "Apply"}
</button>
</div>


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
// test change
// test change
// test change
// test change
// test change
// test change
// test change
// test change
// test change
// test change
// test change
// test change
// test change
// test change
// test change
// test change
// test change
// test change
// test change
// test change
// test change