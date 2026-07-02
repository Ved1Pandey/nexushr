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
const submitWorkRequest = async (type: "WFH" | "OUTDOOR") => {
  try {
    await safeFetch("/work-request", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type }),
    });

    alert(type + " request submitted to manager.");
  } catch (err: any) {
    alert(err.message);
  }
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
const handleWorkRequest = async (type: "OUTDOOR" | "WFH") => {
  const token = sessionStorage.getItem("token");
  if (!token) return;

  try {
    await safeFetch("/applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        application_type: type,
      }),
    });

    alert(`${type} request sent successfully`);
  } catch (err: any) {
    alert(err.message);
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

const workingMinutes = todayRecord
  ? Math.floor(
      (
        (todayRecord.punch_out
          ? new Date(todayRecord.punch_out).getTime()
          : Date.now()) -
        new Date(todayRecord.punch_in).getTime()
      ) / 60000
    )
  : 0;

const workingHours = `${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m`;
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
    padding: "20px",
  }}
>
  
<div
  style={{
    maxWidth: "1200px",
    margin: "0 auto",
  }}
>
  <div
    style={{
      background: "#ffffff",
      color: "#111827",
      border: "1px solid #e5e7eb",
      padding: "18px",
      borderRadius: "16px",
boxShadow: "0 2px 8px rgba(0,0,0,.05)",
marginBottom: "20px",    }}
  >
    <h1 style={{ margin: 0, fontSize: "32px" }}>Welcome, {user?.name}</h1>

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
 <div
  style={{
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    margin: "15px 0 20px",
    color: "#6b7280",
    fontSize: "15px",
    fontWeight: 500,
  }}
>
  <span><b>ID:</b> {user?.id}</span>
  <span><b>Role:</b> {user?.role}</span>
  <span><b>Dept:</b> {user?.department || "--"}</span>
  <span><b>DOJ:</b> {user?.joining_date || "--"}</span>
</div>
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: 20,
    marginBottom: 25,
  }}
>
  <button
    onClick={() => setShowAttendance(true)}
    style={{
      padding: 20,
      borderRadius: 15,
      border: "none",
      background: " #f59e0b",
      color: "white",
      cursor: "pointer",
      fontSize: 16,
      fontWeight: 600,
    }}
  >
    📍 Attendance
  </button>

  <button
    onClick={() =>
      document
        .getElementById("leave-form")
        ?.scrollIntoView({ behavior: "smooth" })
    }
    style={{
      padding: 20,
      borderRadius: 15,
      border: "none",
      background: " #f59e0b",
      color: "white",
      cursor: "pointer",
      fontSize: 16,
      fontWeight: 600,
    }}
  >
    📝 Apply Leave
  </button>

 
  <button
    onClick={() => {
      sessionStorage.clear();
      navigate("/");
    }}
    style={{
      padding: 20,
      borderRadius: 15,
      border: "none",
      background: " #f59e0b",
      color: "white",
      cursor: "pointer",
      fontSize: 16,
      fontWeight: 600,
    }}
  >
    🚪 Logout
  </button>
</div>


<div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    margin: "16px 0",
    flexWrap: "wrap",
  }}
>
  <span style={{ background:"#fff7ed", padding:"6px 12px", borderRadius:999 }}>
    Pending {myPending}
  </span>

  <span style={{ background:"#ecfdf5", padding:"6px 12px", borderRadius:999 }}>
    Approved {myApproved}
  </span>

  <span style={{ background:"#fef2f2", padding:"6px 12px", borderRadius:999 }}>
    Rejected {myRejected}
  </span>
</div>


<div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "20px",
    flexWrap: "wrap",
  }}
>
  <div
    style={{
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      padding: "12px 18px",
      borderRadius: "10px",
      minWidth: "140px",
      textAlign: "center",
    }}
  >
    <h3>{workingHours}</h3>
    <p>Working Hours</p>
  </div>

  <div
    style={{
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      padding: "15px 25px",
      borderRadius: "10px",
      minWidth: "180px",
      textAlign: "center",
    }}
  >
    <h3>
      {todayRecord
        ? new Date(todayRecord.punch_in).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--"}
    </h3>
    <p>Punch In</p>
  </div>

  <div
    style={{
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      padding: "15px 25px",
      borderRadius: "10px",
      minWidth: "180px",
      textAlign: "center",
    }}
  >
    <h3>
      {todayRecord?.punch_out
        ? new Date(todayRecord.punch_out).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--"}
    </h3>
    <p>Punch Out</p>
  </div>
</div>
{/* 👈 My Leaves cards ka end */}
<div
style={{
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "16px",
  marginBottom: "20px",
}}
>
  <button
    onClick={handlePunchIn}
    disabled={punchLoading}
    style={{
      background: "#f59e0b",
      color: "white",
      border: "none",
      padding: "10px 18px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: 600,
    }}
  >
    Punch In
  </button>

  <button
    onClick={handlePunchOut}
    disabled={punchLoading}
    style={{
      background: "#f59e0b",
      color: "white",
      border: "none",
      padding: "10px 18px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: 600,
    }}
  >
    Punch Out
  </button>

<button
  onClick={() => handleWorkRequest("OUTDOOR")}
  style={{
    background: "#f59e0b",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  }}
>
  Outdoor
</button>

<button
  onClick={() => handleWorkRequest("WFH")}
  style={{
    background: "#f59e0b",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  }}
>
  WFH
</button>
</div>
      {/* BALANCE */}
<div
  style={{
    background: "white",
    maxWidth: "700px",
    margin: "20px auto",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,.08)",
  }}
>
  
<div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    padding: "10px 0",
  }}
>
  <span
    style={{
      background: "#fff7ed",
      padding: "8px 16px",
      borderRadius: "8px",
      fontWeight: 600,
    }}
  >
    CL : {balance?.CL ?? 0}
  </span>

  <span
    style={{
      background: "#fff7ed",
      padding: "8px 16px",
      borderRadius: "8px",
      fontWeight: 600,
    }}
  >
    SL : {balance?.SL ?? 0}
  </span>

  <span
    style={{
      background: "#fff7ed",
      padding: "8px 16px",
      borderRadius: "8px",
      fontWeight: 600,
    }}
  >
    PL : {balance?.PL ?? 0}
  </span>
</div>
</div>
<div
  style={{
    background: "white",
    maxWidth: "720px",
    margin: "20px auto",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  }}
>
  <h2 style={{ marginTop: 0 }}>📝 Apply Leave</h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "15px",
    }}
  >
    <div>
      <label>Leave Type</label>
      <br />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as LeaveType)}
        style={{
          width: "100%",
          padding: 10,
          marginTop: 5,
        }}
      >
        <option value="CL">Casual Leave</option>
        <option value="SL">Sick Leave</option>
        <option value="PL">Privilege Leave</option>
      </select>
    </div>

    <div>
      <label>Reason</label>
      <br />
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Enter reason"
        style={{
          width: "100%",
          padding: 10,
          marginTop: 5,
        }}
      />
    </div>

    <div>
      <label>From Date</label>
      <br />
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginTop: 5,
        }}
      />
    </div>

    <div>
      <label>To Date</label>
      <br />
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginTop: 5,
        }}
      />
    </div>
  </div>

  <button
    onClick={handleApplyLeave}
    disabled={submitting}
style={{
  display: "block",
  margin: "20px auto 0",
  background: "#f59e0b",
  color: "white",
  border: "none",
  padding: "12px 30px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 600,
}}
  >
    {submitting ? "Applying..." : "Submit Leave Request"}
  </button>
</div>


{/* ================= MY LEAVES ================= */}
<h3>My Leaves</h3>

{myOwnLeaves.map((l) => (
  <div
  key={l.id}
  style={{
    background: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
    borderLeft:
      l.status === "APPROVED"
        ? "6px solid #f59e0b"
        : l.status === "REJECTED"
        ? "6px solid #f59e0b"
        : "6px solid #f59e0b",
  }}
>
  <h3 style={{ margin: 0 }}>📝 {l.type} Leave</h3>

  <p><b>Status:</b> {l.status}</p>

  <p>
    <b>From:</b>{" "}
    {new Date(l.from_date).toLocaleDateString()}
  </p>

  <p>
    <b>To:</b>{" "}
    {new Date(l.to_date).toLocaleDateString()}
  </p>

  <p><b>Reason:</b> {l.reason}</p>
</div>
))}

{/* ================= TEAM LEAVES ================= */}
{(isTL || isManager) && (
  <>
    <h3>Team Leaves</h3>

    {teamLeaves.map((l) => (
      <div
  key={l.id}
  style={{
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    boxShadow: "0 4px 12px rgba(0,0,0,.08)",
    borderLeft:
      l.status === "APPROVED"
        ? "6px solid #f59e0b"
        : l.status === "REJECTED"
        ? "6px solid #dc2626"
        : "6px solid #f59e0b",
  }}
>
  <h3 style={{ margin: 0 }}>{l.employees?.name}</h3>

  <p><b>Type:</b> {l.type}</p>

  <p><b>Status:</b> {l.status}</p>

  <p><b>From:</b> {l.from_date}</p>

  <p><b>To:</b> {l.to_date}</p>

  <p><b>Reason:</b> {l.reason}</p>

  {l.status?.toUpperCase() === "PENDING" &&
    String(l.employee_id) !== String(user?.id) && (
      <>
        <button
          onClick={() => handleAction(l.id, "APPROVED")}
        >
          ✅ Approve
        </button>

        <button
          onClick={() => handleAction(l.id, "REJECTED")}
          style={{ marginLeft: 10 }}
        >
          ❌ Reject
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
</div>  
  );
};   // ← Component function close

export default Dashboard;
//vedpandey
//vedpandey