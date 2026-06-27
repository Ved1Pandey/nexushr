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
      background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
      color: "white",
      padding: "20px",
      borderRadius: "20px",
      marginBottom: "30px",
      boxShadow: "0 10px 30px rgba(37,99,235,0.25)",
    }}
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
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    marginTop: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  }}
>
  <h3 style={{ marginTop: 0 }}>👤 Employee Profile</h3>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
      gap: "15px",
    }}
  >
    <div>
      <b>Employee ID</b>
      <p>{user?.id || "EMP001"}</p>
    </div>

    <div>
      <b>Department</b>
      <p>{user?.department || "Coming Soon"}</p>
    </div>

    <div>
      <b>Role</b>
      <p>{user?.role}</p>
    </div>

    <div>
      <b>Joining Date</b>
      <p>{user?.joining_date || "Coming Soon"}</p>
    </div>
  </div>
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
      background: "#2563eb",
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
      background: "#16a34a",
      color: "white",
      cursor: "pointer",
      fontSize: 16,
      fontWeight: 600,
    }}
  >
    📝 Apply Leave
  </button>

  <button
    onClick={() => setShowAttendance(false)}
    style={{
      padding: 20,
      borderRadius: 15,
      border: "none",
      background: "#ea580c",
      color: "white",
      cursor: "pointer",
      fontSize: 16,
      fontWeight: 600,
    }}
  >
    📅 Dashboard
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
      background: "#dc2626",
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
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 20,
    marginTop: 25,
    marginBottom: 25,
  }}
>

  {/* Calendar */}

  <div
    style={{
      background: "white",
      borderRadius: 15,
      padding: 20,
      boxShadow: "0 5px 15px rgba(0,0,0,.08)"
    }}
  >
    <h3>📅 Calendar</h3>

    <input
      type="date"
      style={{
        padding:10,
        fontSize:16,
        width:"100%",
        borderRadius:8
      }}
    />

    <br/><br/>

    <b>Upcoming Events</b>

    <ul>
      <li>15 Aug - Independence Day</li>
      <li>02 Oct - Gandhi Jayanti</li>
      <li>25 Dec - Christmas</li>
    </ul>

  </div>

  {/* Notifications */}

  <div
    style={{
      background:"white",
      borderRadius:15,
      padding:20,
      boxShadow:"0 5px 15px rgba(0,0,0,.08)"
    }}
  >

    <h3>🔔 Notifications</h3>

    <ul>

      <li>Attendance Updated</li>

      <li>Leave Balance Refreshed</li>

      <li>1 Pending Approval</li>

      <li>Monthly Review Coming</li>

    </ul>

  </div>

</div>
<div
id="leave-form"
  style={{
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    textAlign: "center",
  }}
>
<div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: "20px",
  }}
>
  <div
    style={{
      background: "#fff7ed",
      padding: "12px 20px",
      borderRadius: "10px",
    }}
  >
    Pending: {myPending}
  </div>

  <div
    style={{
      background: "#ecfdf5",
      padding: "12px 20px",
      borderRadius: "10px",
    }}
  >
    Approved: {myApproved}
  </div>

  <div
    style={{
      background: "#fef2f2",
      padding: "12px 20px",
      borderRadius: "10px",
    }}
  >
    Rejected: {myRejected}
  </div>
</div>
</div>
{/* 👈 My Leaves cards ka end */}
<div
  style={{
    textAlign: "center",
    padding: "30px 0",
  }}
>
  <div style={{ fontSize: "48px" }}>💰</div>

  <h3 style={{ margin: "10px 0" }}>
    Payroll Module
  </h3>

  <p style={{ color: "#666" }}>
    Coming Soon
  </p>

  <button
    style={{
      background: "#2563eb",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "8px",
      cursor: "pointer",
      marginTop: "10px",
    }}
  >
    View Payroll
  </button>
</div>
<div
  style={{
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    marginTop: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    textAlign: "center",
  }}
>
  <h2>🎫 Support Tickets</h2>

  <div style={{ fontSize: "48px", margin: "20px 0" }}>
    🛠️
  </div>

  <h3>Coming Soon</h3>

  <p style={{ color: "#666" }}>
    Raise IT, HR and Admin support requests.
  </p>

  <button
    style={{
      background: "#2563eb",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "8px",
      cursor: "pointer",
      marginTop: "15px",
    }}
  >
    Create Ticket
  </button>
</div>

<div
  style={{
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    marginTop: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  }}
>
  <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
    📊 Reports & Analytics
  </h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
      gap: "16px",
    }}
  >
    <div
      style={{
        background: "#eff6ff",
        padding: "20px",
        borderRadius: "12px",
        textAlign: "center",
      }}
    >
      <h3>Attendance</h3>
      <p>Coming Soon</p>
    </div>

    <div
      style={{
        background: "#ecfdf5",
        padding: "20px",
        borderRadius: "12px",
        textAlign: "center",
      }}
    >
      <h3>Leave Report</h3>
      <p>Coming Soon</p>
    </div>

    <div
      style={{
        background: "#fef3c7",
        padding: "20px",
        borderRadius: "12px",
        textAlign: "center",
      }}
    >
      <h3>Payroll</h3>
      <p>Coming Soon</p>
    </div>

    <div
      style={{
        background: "#f3e8ff",
        padding: "20px",
        borderRadius: "12px",
        textAlign: "center",
      }}
    >
      <h3>Performance</h3>
      <p>Coming Soon</p>
    </div>
  </div>
</div>
<div
  style={{
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    marginTop: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  }}
>
  <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
    💻 Company Assets
  </h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
      gap: "16px",
    }}
  >
    <div
      style={{
        background: "#eef6ff",
        padding: "20px",
        borderRadius: "12px",
        textAlign: "center",
      }}
    >
      <h3>Laptop</h3>
      <p>Dell Latitude</p>
      <small>Assigned</small>
    </div>

    <div
      style={{
        background: "#ecfdf5",
        padding: "20px",
        borderRadius: "12px",
        textAlign: "center",
      }}
    >
      <h3>Mouse</h3>
      <p>Logitech</p>
      <small>Assigned</small>
    </div>

    <div
      style={{
        background: "#fef3c7",
        padding: "20px",
        borderRadius: "12px",
        textAlign: "center",
      }}
    >
      <h3>Access Card</h3>
      <p>Active</p>
      <small>Assigned</small>
    </div>

    <div
      style={{
        background: "#f3e8ff",
        padding: "20px",
        borderRadius: "12px",
        textAlign: "center",
      }}
    >
      <h3>More Assets</h3>
      <p>Coming Soon</p>
    </div>
  </div>
</div>
<div
  style={{
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  }}
>
  <h3 style={{ marginTop: 0 }}>Quick Actions</h3>

  <div
    style={{
      display: "flex",
      gap: "15px",
      flexWrap: "wrap",
    }}
  ><button
  onClick={handlePunchIn}
  style={{
    background: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: 600,
    marginRight: "10px",
  }}
>
      Punch In
    </button>

 <button
  onClick={handlePunchOut}
  style={{
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: 600,
    marginRight: "10px",
  }}
>

  
      Punch Out
    </button>

<button
  onClick={() =>
    document
      .getElementById("applyLeave")
      ?.scrollIntoView({ behavior: "smooth" })
  }
  style={{
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: 600,
  }}
>      Apply Leave
    </button>
  </div>
</div>
<div
  style={{
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  }}
>
  <h3 style={{ marginTop: 0 }}>🎯 Today's Summary</h3>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
      gap: "15px",
    }}
  >
    <div
      style={{
        background: "#ecfdf5",
        padding: "18px",
        borderRadius: "10px",
        textAlign: "center",
      }}
    >
      <h2>8h 15m</h2>
      <p>Working Hours</p>
    </div>

    <div
      style={{
        background: "#eff6ff",
        padding: "18px",
        borderRadius: "10px",
        textAlign: "center",
      }}
    >
      <h2>95%</h2>
      <p>Attendance</p>
    </div>

    <div
      style={{
        background: "#fef3c7",
        padding: "18px",
        borderRadius: "10px",
        textAlign: "center",
      }}
    >
      <h2>2</h2>
      <p>Pending Tasks</p>
    </div>

    <div
      style={{
        background: "#f3e8ff",
        padding: "18px",
        borderRadius: "10px",
        textAlign: "center",
      }}
    >
      <h2>0</h2>
      <p>Open Tickets</p>
    </div>
  </div>
</div>
      {/* BALANCE */}
<div
  id="applyLeave"
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
    marginBottom: "20px",
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
      marginTop: 20,
      background: "#2563eb",
      color: "white",
      border: "none",
      padding: "12px 24px",
      borderRadius: 8,
      cursor: "pointer",
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
        ? "6px solid #22c55e"
        : l.status === "REJECTED"
        ? "6px solid #ef4444"
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
        ? "6px solid #16a34a"
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
// git test