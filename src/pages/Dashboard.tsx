import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type Attendance = {
  id: number;
  punch_in: string;
  punch_out?: string;
  latitude?: number;
  longitude?: number;
};

type LeaveType = "CL" | "SL" | "PL";

const parseAttendanceDate = (value: string) => {
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
};

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState<LeaveType>("CL");
  const [submitting, setSubmitting] = useState(false);
  const [punchLoading, setPunchLoading] = useState(false);
  const [workRequests, setWorkRequests] = useState<any[]>([]);
  const navigate = useNavigate();
  const [showMyRequests] = useState(false);
  const [attendanceRequests, setAttendanceRequests] = useState<any[]>([]);
  const [showTeamLeaves,setShowTeamLeaves]=useState(false);
  const [showTeamWorkRequests, setShowTeamWorkRequests] = useState(false);
  const [showAttendanceRequests, setShowAttendanceRequests] = useState(false);
  const [showRequestMenu, setShowRequestMenu] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);


  // ==============================
  // SAFE FETCH
  // ==============================
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

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
//const submitWorkRequest = async (type: "WFH" | "OUTDOOR") => {
  //try {
    //await safeFetch("/work-request", {
      //method: "POST",
      //headers: {
        //Authorization: `Bearer ${localStorage.getItem("token")}`,
        //"Content-Type": "application/json",
      //},
      //body: JSON.stringify({ type }),
    //});

    //alert(type + " request submitted to manager.");
  //} catch (err: any) {
    //alert(err.message);
  //}
//};

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

  console.log("ATTENDANCE API RESPONSE:", data);

  setAttendance(Array.isArray(data) ? data : []);
};
const fetchWorkRequests = async (token: string) => {
  try {
    const data: any = await safeFetch("/work-request", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setWorkRequests(Array.isArray(data) ? data : []);
  } catch (err) {
    console.log(err);
  }
};
const fetchAttendanceRegularization = async (token: string) => {
  try {
    const data: any = await safeFetch(
      "/team-attendance-regularization",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setAttendanceRequests(Array.isArray(data) ? data : []);
  } catch (err) {
    console.log(err);
  }
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
    await safeFetch("/work-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type,
      }),
    });

    alert(`${type} request sent to manager ✅`);
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
const handleWorkAction = async (
  id: number,
  status: "APPROVED" | "REJECTED"
) => {
  const token = sessionStorage.getItem("token");
  if (!token) return;

  await safeFetch(`/work-request/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  fetchWorkRequests(token);
};
const handleAttendanceAction = async (
  id: number,
  status: "APPROVED" | "REJECTED"
) => {
  const token = sessionStorage.getItem("token");
  if (!token) return;

  await safeFetch(`/attendance-regularization/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  fetchAttendanceRegularization(token);
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
  fetchWorkRequests(token);
  fetchAttendanceRegularization(token);
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
const myOwnWorkRequests = workRequests.filter(
  (r) => String(r.employee_id) === String(user?.id)
);

const myRequests = [
  ...myOwnLeaves.map((leave) => ({
    requestKey: `leave-${leave.id}`,
    requestType: "LEAVE",
    requestDate: leave.from_date,
    data: leave,
  })),
  ...myOwnWorkRequests.map((request) => ({
    requestKey: `work-${request.id}`,
    requestType: request.type,
    requestDate: request.created_at,
    data: request,
  })),
].sort(
  (a, b) =>
    new Date(b.requestDate).getTime() -
    new Date(a.requestDate).getTime()
);

const myPending = myRequests.filter(
  (request) => request.data.status === "PENDING"
).length;

const myApproved = myRequests.filter(
  (request) => request.data.status === "APPROVED"
).length;

const myRejected = myRequests.filter(
  (request) => request.data.status === "REJECTED"
).length;


const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const todayRecord = attendance
  .filter((a: Attendance) => 
    parseAttendanceDate(a.punch_in).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) === today
  )
  .sort(
    (a: Attendance, b: Attendance) =>
      parseAttendanceDate(b.punch_in).getTime() -
      parseAttendanceDate(a.punch_in).getTime()
  )[0] as Attendance | undefined;

const workingMinutes = todayRecord
  ? Math.floor(
      (
        (todayRecord.punch_out
          ? parseAttendanceDate(todayRecord.punch_out).getTime()
          : Date.now()) -
        parseAttendanceDate(todayRecord.punch_in).getTime()
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
      padding: "28px 20px",
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
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
          color: "#ffffff",
          padding: "26px 28px",
          borderRadius: "18px",
          marginBottom: "18px",
          boxShadow: "0 8px 24px rgba(37, 99, 235, 0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                opacity: 0.82,
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Employee Dashboard
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "28px",
                lineHeight: 1.2,
                fontWeight: 700,
              }}
            >
              Welcome, {user?.name || "Employee"} 👋
            </h1>

            <p
              style={{
                margin: "9px 0 0",
                fontSize: "14px",
                opacity: 0.9,
              }}
            >
              Manage your attendance, leave and work requests.
            </p>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.22)",
              padding: "12px 16px",
              borderRadius: "12px",
              minWidth: "150px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                opacity: 0.78,
                marginBottom: "4px",
              }}
            >
              Today's Status
            </div>

            <div
              style={{
                fontSize: "17px",
                fontWeight: 700,
              }}
            >
              {todayStatus}
            </div>
          </div>
        </div>

  </div>
<div
  style={{
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    margin: "12px 0 22px",
    color: "#64748b",
    fontSize: "14px",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
    marginBottom: 25,
  }}
>
  <button
    onClick={() => setShowRequestMenu(!showRequestMenu)}
    style={{
      padding: "16px 20px",
      borderRadius: 12,
      border: "1px solid #2563eb",
      background: "#2563eb",
      color: "#ffffff",
      cursor: "pointer",
      fontSize: 15,
      fontWeight: 600,
      boxShadow: "0 2px 5px rgba(37, 99, 235, 0.20)",
      transition: "all 0.2s ease",
    }}
  >
    ➕ New Request
  </button>

  <button
    onClick={() => {
      sessionStorage.clear();
      navigate("/");
    }}
    style={{
      padding: "16px 20px",
      borderRadius: 12,
      border: "1px solid #e2e8f0",
      background: "#ffffff",
      color: "#475569",
      cursor: "pointer",
      fontSize: 15,
      fontWeight: 600,
      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
      transition: "all 0.2s ease",
    }}
  >
    🚪 Logout
  </button>
</div>
{showRequestMenu && (
  <div
 style={{
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 18,
  marginBottom: 20,
  display: "flex",
  justifyContent: "center",
  gap: 10,
  flexWrap: "wrap",
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
}}  >
    <button
      onClick={() => {
        setShowRequestMenu(false);
        setShowLeaveForm(true);

        setTimeout(() => {
          document
            .getElementById("leave-form")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 0);
      }}
      style={{
  padding: "11px 17px",
  borderRadius: 10,
  border: "1px solid #dbeafe",
  background: "#eff6ff",
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
}}    >
      📝 Apply Leave
    </button>
   <button
  onClick={() => {
    setShowRequestMenu(false);
    handleWorkRequest("WFH");
  }}
  style={{
    padding: "11px 17px",
    borderRadius: 10,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  }}
>
  🏠 WFH Request
</button>

<button
  onClick={() => {
    setShowRequestMenu(false);
    handleWorkRequest("OUTDOOR");
  }}
  style={{
    padding: "11px 17px",
    borderRadius: 10,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  }}
>
  🚗 Outdoor Request
</button>

    <button
  onClick={() => {
    setShowRequestMenu(false);
    navigate("/attendance-regularization");
  }}
  style={{
    padding: "11px 17px",
    borderRadius: 10,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all 0.2s ease",
  }}
>
  🕒 Attendance Regularization
    </button>
  </div>
)}


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
  border: "1px solid #e2e8f0",
  padding: "18px 20px",
  borderRadius: 14,
  minWidth: "160px",
  textAlign: "center",
  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.06)",
}}  >
    <h3>{workingHours}</h3>
    <p>Working Hours</p>
  </div>
  <div
    style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      padding: "18px 20px",
      borderRadius: 14,
      minWidth: "160px",
      textAlign: "center",
      boxShadow: "0 2px 6px rgba(15, 23, 42, 0.06)",
    }}
  >
    <h3>
      {todayRecord
        ? parseAttendanceDate(todayRecord.punch_in).toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
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
  border: "1px solid #e2e8f0",
  padding: "18px 20px",
  borderRadius: 14,
  minWidth: "160px",
  textAlign: "center",
  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.06)",
}}
  >
    <h3>
      {todayRecord?.punch_out
        ? parseAttendanceDate(todayRecord.punch_out).toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
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
      background: "#2563eb",
      color: "#ffffff",
      border: "none",
      padding: "11px 20px",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: "14px",
      boxShadow: "0 2px 6px rgba(37, 99, 235, 0.2)",
    }}
  >
    🟢 Punch In
  </button>

  <button
    onClick={handlePunchOut}
    disabled={punchLoading}
    style={{
      background: "#ffffff",
      color: "#dc2626",
      border: "1px solid #fecaca",
      padding: "11px 20px",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: "14px",
      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
    }}
  >
    🔴 Punch Out
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
    gap: "12px",
    padding: "10px 0",
    flexWrap: "wrap",
  }}
>
<span
  style={{
    background: "#eff6ff",
    color: "#2563eb",
    padding: "10px 18px",
    borderRadius: "10px",
    fontWeight: 600,
    border: "1px solid #dbeafe",
    minWidth: "100px",
    textAlign: "center",
  }}
>
    CL : {balance?.CL ?? 0}
  </span>

<span
  style={{
    background: "#eff6ff",
    color: "#2563eb",
    padding: "10px 18px",
    borderRadius: "10px",
    fontWeight: 600,
    border: "1px solid #dbeafe",
    minWidth: "100px",
    textAlign: "center",
  }}
>
    SL : {balance?.SL ?? 0}
  </span>

<span
  style={{
    background: "#eff6ff",
    color: "#2563eb",
    padding: "10px 18px",
    borderRadius: "10px",
    fontWeight: 600,
    border: "1px solid #dbeafe",
    minWidth: "100px",
    textAlign: "center",
  }}
>
    PL : {balance?.PL ?? 0}
  </span>
</div>
</div>

<div
  style={{
    display: "grid",
    gridTemplateColumns: showLeaveForm ? "1fr 1fr" : "minmax(320px, 560px)",
    justifyContent: "center",
    gap: 20,
    alignItems: "start",
    margin: "25px 0",
  }}
>

{/* APPLY LEAVE */}

{showLeaveForm && (
<div
  id="leave-form"
style={{
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.07)",
}}
>

<h2
  style={{
    marginTop: 0,
    marginBottom: 20,
    fontSize: 20,
    color: "#0f172a",
  }}
>
📝 Apply Leave
</h2>

<select
value={type}
onChange={(e)=>setType(e.target.value as LeaveType)}

style={{
  width: "100%",
  padding: "11px 12px",
  marginBottom: 12,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: 14,
  boxSizing: "border-box",
}}
>
<option value="CL">Casual Leave</option>
<option value="SL">Sick Leave</option>
<option value="PL">Privilege Leave</option>
</select>

<input
placeholder="Reason"
value={reason}
onChange={(e)=>setReason(e.target.value)}
style={{
  width: "100%",
  padding: "11px 12px",
  marginBottom: 12,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: 14,
  boxSizing: "border-box",
}}
/>

<input
type="date"
value={fromDate}
onChange={(e)=>setFromDate(e.target.value)}
style={{
  width: "100%",
  padding: "11px 12px",
  marginBottom: 12,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: 14,
  boxSizing: "border-box",
}}
/>

<input
type="date"
value={toDate}
onChange={(e)=>setToDate(e.target.value)}

style={{
  width: "100%",
  padding: "11px 12px",
  marginBottom: 20,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: 14,
  boxSizing: "border-box",
}}
/>

<button
onClick={handleApplyLeave}
style={{
  width: "100%",
  background: "#2563eb",
  color: "#ffffff",
  padding: "13px 14px",
  border: "none",
  borderRadius: 10,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 14,
  boxShadow: "0 2px 6px rgba(37, 99, 235, 0.2)",
}}
>
{submitting ? "Applying..." : "Submit Leave"}
</button>

</div>
)}

{/* CALENDAR */}
<div
  style={{
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.07)",
  }}
>

<h2
  style={{
    marginTop: 0,
    marginBottom: 20,
    fontSize: 20,
    color: "#0f172a",
  }}
>
  📅 Attendance Calendar
</h2>

<Calendar
  value={new Date()}
  tileContent={({ date, view }) => {
  if (view !== "month") return null;

  const day = date.getDay();

  if (day === 0 || day === 6) {
    return (
      <div style={{ fontSize: 10, color: "#9ca3af" }}>
        OFF
      </div>
    );
  }

  const dateKey = date.toLocaleDateString("en-CA");
  const todayKey = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const attendanceRecord = attendance.find(
    (a) =>
      parseAttendanceDate(a.punch_in).toLocaleDateString(
        "en-CA",
        { timeZone: "Asia/Kolkata" }
      ) === dateKey
  );

  if (attendanceRecord) {
    return (
      <div style={{ fontSize: 10, color: "#16a34a", fontWeight: 700 }}>
        PRESENT
      </div>
    );
  }

  const approvedLeave = myOwnLeaves.find((leave) => {
    if (leave.status !== "APPROVED") return false;

    return (
      dateKey >= leave.from_date.slice(0, 10) &&
      dateKey <= leave.to_date.slice(0, 10)
    );
  });

  if (approvedLeave) {
    return (
      <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700 }}>
        {approvedLeave.type}
      </div>
    );
  }

  const approvedWorkRequest = workRequests.find((request) => {
    if (
      String(request.employee_id) !== String(user?.id) ||
      request.status !== "APPROVED"
    ) {
      return false;
    }

    const requestDate = new Date(
      request.created_at
    ).toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    return requestDate === dateKey;
  });

  if (approvedWorkRequest) {
    return (
      <div style={{ fontSize: 10, color: "#2563eb", fontWeight: 700 }}>
        {approvedWorkRequest.type}
      </div>
    );
  }

  if (dateKey < todayKey) {
    return (
      <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 700 }}>
        ABSENT
      </div>
    );
  }

  return null;
}}

/>


</div>

</div>

{/* ================= MY REQUESTS ================= */}

<div
  onClick={() => setShowTeamWorkRequests(!showTeamWorkRequests)}
  style={{
    background: "#ffffff",
    padding: "16px 20px",
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 15,
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.06)",
  }}
>
  <h3
    style={{
      margin: 0,
      fontSize: 17,
      color: "#0f172a",
    }}
  >
    💼 Team Work Requests
  </h3>

  <span
    style={{
      fontSize: 16,
      color: "#64748b",
      fontWeight: 600,
    }}
  >
    {showTeamWorkRequests ? "▲" : "▼"}
  </span>
</div>

{showMyRequests && (
  <>
    {myRequests.length === 0 ? (
      <div
        style={{
          background: "#fff",
          borderRadius: 15,
          padding: 20,
          marginBottom: 15,
          boxShadow: "0 5px 15px rgba(0,0,0,.08)",
        }}
      >
        No requests found.
      </div>
    ) : (
      myRequests.map((request) => {
        const item = request.data;

        return (
          <div
            key={request.requestKey}
      
style={{
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 20,
  marginBottom: 15,
  boxShadow: "0 3px 10px rgba(15, 23, 42, 0.06)",
  borderLeft:
    item.status === "APPROVED"
      ? "5px solid #16a34a"
      : item.status === "REJECTED"
      ? "5px solid #dc2626"
      : "5px solid #d97706",
}}          >
            {request.requestType === "LEAVE" ? (
              <>
                <h3 style={{ marginTop: 0 }}>
                  📝 {item.type} Leave
                </h3>
                <p><b>Status:</b> {item.status}</p>
                <p>
                  <b>From:</b>{" "}
                  {new Date(item.from_date).toLocaleDateString("en-IN")}
                </p>
                <p>
                  <b>To:</b>{" "}
                  {new Date(item.to_date).toLocaleDateString("en-IN")}
                </p>
                <p><b>Reason:</b> {item.reason}</p>
              </>
            ) : (
              <>
                <h3 style={{ marginTop: 0 }}>
                  {request.requestType === "WFH"
                    ? "🏠 WFH Request"
                    : "🚗 Outdoor Request"}
                </h3>
                <p><b>Status:</b> {item.status}</p>
                <p>
                  <b>Date:</b>{" "}
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString("en-IN")
                    : "--"}
                </p>
                <p>
                  <b>Time:</b>{" "}
                  {item.created_at
                    ? new Date(item.created_at).toLocaleTimeString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--"}
                </p>
              </>
            )}
          </div>
        );
      })
    )}
  </>
)}

{/* ================= TEAM LEAVES ================= */}
{(isTL || isManager) && (
<>
<div
  onClick={() => setShowTeamLeaves(!showTeamLeaves)}
  style={{
    background: "#ffffff",
    padding: "16px 20px",
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 15,
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.06)",
  }}
>
  <h3
    style={{
      margin: 0,
      fontSize: 17,
      color: "#0f172a",
    }}
  >
    👥 Team Leaves ({teamLeaves.length})
  </h3>

  <span
    style={{
      fontSize: 16,
      color: "#64748b",
      fontWeight: 600,
    }}
  >
    {showTeamLeaves ? "▲" : "▼"}
  </span>
</div>

{showTeamLeaves && teamLeaves.map((l)=>(
      <div
  key={l.id}
style={{
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 20,
  marginBottom: 15,
  boxShadow: "0 3px 10px rgba(15, 23, 42, 0.06)",
  borderLeft:
    l.status === "APPROVED"
      ? "5px solid #16a34a"
      : l.status === "REJECTED"
      ? "5px solid #dc2626"
      : "5px solid #d97706",
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
{(isTL || isManager) && (
  <>
    <div
      onClick={() => setShowTeamWorkRequests(!showTeamWorkRequests)}
      style={{
        background: "#fff",
        padding: "16px 20px",
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 15,
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
      }}
    >
      <h3 style={{ margin: 0 }}>
        💼 Team Work Requests
      </h3>

      <span>{showTeamWorkRequests ? "▲" : "▼"}</span>
    </div>

    {showTeamWorkRequests &&
      workRequests
        .filter((r) => String(r.employee_id) !== String(user?.id))
        .map((r) => (
          <div
  key={r.id}
  style={{
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    padding: 20,
    borderRadius: 14,
    marginBottom: 15,
    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.06)",
    borderLeft:
      r.status === "APPROVED"
        ? "5px solid #16a34a"
        : r.status === "REJECTED"
        ? "5px solid #dc2626"
        : "5px solid #d97706",
  }}
>
            <p><b>Employee:</b> {r.employees?.name}</p>

<p><b>Type:</b> {r.type}</p>

<p>
  <b>Date:</b>{" "}
  {r.created_at
    ? new Date(r.created_at).toLocaleDateString("en-IN")
    : "--"}
</p>

<p>
  <b>Time:</b>{" "}
  {r.created_at
    ? new Date(r.created_at).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--"}
</p>

<p><b>Status:</b> {r.status}</p>


            {r.status === "PENDING" && (
              <>
                <button
                  onClick={() =>
                    handleWorkAction(r.id, "APPROVED")
                  }
                >
                  ✅ Approve
                </button>

                <button
                  onClick={() =>
                    handleWorkAction(r.id, "REJECTED")
                  }
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
{(isTL || isManager) && (
  <>
    <div
      onClick={() =>
        setShowAttendanceRequests(!showAttendanceRequests)
      }
      style={{
        background: "#fff",
        padding: "16px 20px",
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 15,
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
      }}
    >
      <h3 style={{ margin: 0 }}>
        🕒 Attendance Regularization Requests
      </h3>

      <span>
        {showAttendanceRequests ? "▲" : "▼"}
      </span>
    </div>

    {showAttendanceRequests &&
      attendanceRequests.map((r) => (
        <div
          key={r.id}
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 12,
            marginBottom: 15,
            boxShadow: "0 4px 12px rgba(0,0,0,.08)",
          }}
        >
          <p><b>Employee:</b> {r.employees?.name}</p>
          <p><b>Date:</b> {r.attendance_date}</p>
          <p><b>Punch In:</b> {r.new_punch_in}</p>
          <p><b>Punch Out:</b> {r.new_punch_out}</p>
          <p><b>Reason:</b> {r.reason}</p>
          <p><b>Status:</b> {r.status}</p>

          {r.status === "PENDING" && (
            <>
              <button
                onClick={() =>
                  handleAttendanceAction(r.id, "APPROVED")
                }
              >
                ✅ Approve
              </button>

              <button
                onClick={() =>
                  handleAttendanceAction(r.id, "REJECTED")
                }
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

<div
  style={{
    display: "flex",
    gap: 15,
    marginTop: 20,
    flexWrap: "wrap",
  }}
>
  <button
    onClick={() => navigate("/employee-directory")}
    style={{
      padding: 20,
      borderRadius: 15,
      border: "none",
      background: "#f59e0b",
      color: "white",
      cursor: "pointer",
      fontSize: 16,
      fontWeight: 600,
    }}
  >
    👥 Employee Directory
  </button>
</div>


</div>   
</div>  
  );
};   // ← Component function close

export default Dashboard;