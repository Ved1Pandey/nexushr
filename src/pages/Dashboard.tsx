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
  const [showMyRequests, setShowMyRequests] = useState(false);
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

  const isLeadership = isTL || isManager;

  const recentLeaves = (isLeadership ? teamLeaves : myOwnLeaves)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.from_date).getTime() -
        new Date(a.from_date).getTime()
    )
    .slice(0, 5);
  const requestRow = (
    icon: string,
    title: string,
    subtitle: string,
    count: number,
    onClick: () => void,
    show = true
  ) =>
    show ? (
      <button className="request-row" onClick={onClick} type="button">
        <span className="request-row-icon">{icon}</span>
        <span className="request-row-copy">
          <span className="request-row-title">{title}</span>
          <span className="request-row-subtitle">{subtitle}</span>
        </span>
        <span className="request-row-count">{count}</span>
        <span className="request-row-arrow">›</span>
      </button>
    ) : null;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        .dashboard-page {
          min-height: 100vh;
          background: #f6f8fc;
          padding: 20px;
          color: #0f172a;
        }

        .dashboard-shell {
          max-width: 1400px;
          margin: 0 auto;
        }

        .hero {
          background: linear-gradient(135deg, #155eef 0%, #1769f5 52%, #0754df 100%);
          color: #fff;
          padding: 27px 28px;
          border-radius: 16px;
          margin-bottom: 18px;
          box-shadow: 0 10px 28px rgba(37, 99, 235, .18);
        }

        .hero-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .eyebrow {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          opacity: .82;
          margin-bottom: 8px;
        }

        .hero h1 {
          margin: 0;
          font-size: 29px;
          line-height: 1.2;
          font-weight: 750;
        }

        .hero p {
          margin: 9px 0 0;
          font-size: 14px;
          opacity: .9;
        }

        .today-status {
          min-width: 145px;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(255,255,255,.14);
          border: 1px solid rgba(255,255,255,.20);
        }

        .today-status small {
          display: block;
          font-size: 12px;
          opacity: .78;
          margin-bottom: 5px;
        }

        .today-status strong {
          font-size: 17px;
        }

        .user-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin: 12px 0 18px;
          color: #475569;
          font-size: 13px;
        }

        .user-meta span { white-space: nowrap; }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(260px, 1.15fr) minmax(360px, 1.45fr) minmax(300px, .95fr);
          gap: 20px;
          align-items: start;
        }

        .left-column {
          min-width: 0;
        }

        .action-grid {
          display: grid;
          grid-template-columns: 1.35fr .9fr;
          gap: 12px;
          margin-bottom: 18px;
        }

        .primary-button,
        .secondary-button,
        .punch-button {
          min-height: 52px;
          border-radius: 11px;
          border: 1px solid transparent;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease;
        }

        .primary-button:hover,
        .secondary-button:hover,
        .punch-button:hover,
        .directory-button:hover {
          transform: translateY(-1px);
        }

        .primary-button {
          background: #1769f5;
          color: #fff;
          box-shadow: 0 5px 14px rgba(23,105,245,.20);
        }

        .secondary-button {
          background: #fff;
          color: #475569;
          border-color: #e2e8f0;
          box-shadow: 0 2px 7px rgba(15,23,42,.05);
        }

        .status-pills {
          display: flex;
          justify-content: flex-start;
          gap: 10px;
          flex-wrap: wrap;
          margin: 0 0 18px;
        }

        .pill {
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 650;
        }

        .pill.pending { background: #fff7ed; color: #d97706; }
        .pill.approved { background: #ecfdf5; color: #15803d; }
        .pill.rejected { background: #fef2f2; color: #dc2626; }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .metric-card {
          background: #fff;
          border: 1px solid #e5eaf2;
          border-radius: 12px;
          min-height: 82px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          box-shadow: 0 3px 10px rgba(15,23,42,.05);
        }

        .metric-card strong {
          font-size: 16px;
          font-weight: 750;
        }

        .metric-card span {
          margin-top: 5px;
          color: #64748b;
          font-size: 13px;
        }

        .punch-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin: 18px 0;
        }

        .punch-button {
          min-height: 42px;
          padding: 0 18px;
        }

        .punch-in {
          background: #1769f5;
          color: #fff;
          box-shadow: 0 4px 10px rgba(23,105,245,.18);
        }

        .punch-out {
          background: #fff;
          color: #dc2626;
          border-color: #fecaca;
        }

        .balance-card,
        .calendar-card,
        .requests-card,
        .recent-card,
        .leave-form {
          background: #fff;
          border: 1px solid #e3e8f0;
          border-radius: 15px;
          box-shadow: 0 3px 14px rgba(15,23,42,.055);
        }

        .balance-card {
          padding: 18px;
        }

        .balance-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 9px;
        }

        .balance-item {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #dbeafe;
          border-radius: 9px;
          padding: 10px 6px;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
        }

        .calendar-card {
          padding: 20px;
          min-width: 0;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 15px;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }

        .card-title-icon {
          color: #1769f5;
          font-size: 18px;
        }

        .calendar-wrap {
          overflow: hidden;
        }

        .calendar-wrap .react-calendar {
          width: 100%;
          border: 1px solid #e5eaf2;
          border-radius: 11px;
          padding: 7px;
          font-family: inherit;
        }

        .calendar-wrap .react-calendar__navigation button {
          color: #1e293b;
          font-weight: 700;
        }

        .calendar-wrap .react-calendar__month-view__weekdays {
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }

        .calendar-wrap .react-calendar__tile {
          min-height: 54px;
          padding: 5px 2px;
          font-size: 12px;
          border-radius: 7px;
        }

        .calendar-wrap .react-calendar__tile--now {
          background: #eff6ff;
        }

        .calendar-wrap .react-calendar__tile--active {
          background: #1769f5;
          color: #fff;
        }

        .requests-card {
          overflow: hidden;
          border-color: #80a8f8;
          box-shadow: 0 3px 14px rgba(37,99,235,.08);
        }

        .requests-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px 20px 16px;
          border-bottom: 1px solid #edf0f5;
          font-size: 18px;
          font-weight: 700;
        }

        .request-row {
          width: 100%;
          display: grid;
          grid-template-columns: 25px 1fr auto 15px;
          align-items: center;
          gap: 10px;
          padding: 15px 18px;
          background: #fff;
          border: 0;
          border-bottom: 1px solid #edf0f5;
          text-align: left;
          cursor: pointer;
          color: #0f172a;
        }

        .request-row:hover {
          background: #f8fbff;
        }

        .request-row-icon {
          font-size: 17px;
          color: #2563eb;
          text-align: center;
        }

        .request-row-copy {
          min-width: 0;
        }

        .request-row-title {
          display: block;
          font-size: 14px;
          font-weight: 700;
        }

        .request-row-subtitle {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.35;
        }

        .request-row-count {
          min-width: 23px;
          padding: 3px 6px;
          border-radius: 6px;
          background: #eaf2ff;
          color: #2563eb;
          font-size: 11px;
          font-weight: 750;
          text-align: center;
        }

        .request-row-arrow {
          color: #64748b;
          font-size: 22px;
          line-height: 1;
        }

        .directory-button {
          width: calc(100% - 36px);
          margin: 14px 18px 18px;
          min-height: 46px;
          border: 0;
          border-radius: 10px;
          background: #f59e0b;
          color: #fff;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease;
        }

        .detail-section {
          margin-top: 8px;
        }

        .detail-card {
          background: #fff;
          border: 1px solid #e3e8f0;
          border-radius: 13px;
          padding: 17px;
          margin-bottom: 10px;
          box-shadow: 0 2px 8px rgba(15,23,42,.045);
        }

        .detail-card h3 {
          margin: 0 0 10px;
          font-size: 15px;
        }

        .detail-card p {
          margin: 6px 0;
          color: #475569;
          font-size: 13px;
        }

        .detail-card button {
          border: 0;
          border-radius: 8px;
          padding: 8px 12px;
          margin-top: 8px;
          cursor: pointer;
          font-weight: 650;
        }

        .recent-card {
          margin-top: 20px;
          overflow: hidden;
        }

        .recent-header {
          padding: 18px 20px;
          border-bottom: 1px solid #edf0f5;
          font-size: 16px;
          font-weight: 700;
        }

        .recent-table-wrap {
          overflow-x: auto;
        }

        .recent-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
          font-size: 12px;
        }

        .recent-table th,
        .recent-table td {
          padding: 12px 14px;
          text-align: left;
          border-bottom: 1px solid #edf0f5;
          white-space: nowrap;
        }

        .recent-table th {
          color: #334155;
          font-weight: 750;
        }

        .recent-table td {
          color: #475569;
        }

        .employee-name {
          color: #1769f5;
          font-weight: 700;
        }

        .type-badge,
        .status-badge {
          display: inline-flex;
          padding: 4px 8px;
          border-radius: 7px;
          font-weight: 700;
        }

        .type-badge {
          background: #eff6ff;
          color: #2563eb;
        }

        .status-badge.pending {
          background: #fff7ed;
          color: #d97706;
        }

        .status-badge.approved {
          background: #ecfdf5;
          color: #15803d;
        }

        .status-badge.rejected {
          background: #fef2f2;
          color: #dc2626;
        }

        .view-all {
          display: block;
          margin: 14px auto 17px;
          border: 0;
          background: transparent;
          color: #1769f5;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .leave-form {
          margin-top: 20px;
          padding: 20px;
        }

        .leave-form h2 {
          margin: 0 0 16px;
          font-size: 18px;
        }

        .leave-form input,
        .leave-form select {
          width: 100%;
          padding: 11px 12px;
          margin-bottom: 11px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          font-size: 14px;
          background: #fff;
          color: #0f172a;
        }

        .submit-leave {
          width: 100%;
          min-height: 44px;
          border: 0;
          border-radius: 9px;
          background: #1769f5;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 1050px) {
          .main-grid {
            grid-template-columns: minmax(250px, 1fr) minmax(340px, 1.25fr);
          }
          .requests-card {
            grid-column: 1 / -1;
          }
          .request-row {
            grid-template-columns: 25px 1fr auto 15px;
          }
        }

        @media (max-width: 720px) {
          .dashboard-page { padding: 12px; }
          .hero { padding: 21px 18px; }
          .hero-inner { align-items: flex-start; flex-direction: column; }
          .today-status { width: 100%; }
          .main-grid { grid-template-columns: 1fr; gap: 14px; }
          .requests-card { grid-column: auto; }
          .action-grid { grid-template-columns: 1fr 1fr; }
          .metric-grid { grid-template-columns: 1fr; }
          .balance-grid { grid-template-columns: repeat(3, 1fr); }
          .calendar-card { padding: 14px; }
          .calendar-wrap .react-calendar__tile { min-height: 48px; }
          .user-meta { gap: 7px 12px; }
          .recent-card { margin-top: 14px; }
        }

        @media (max-width: 430px) {
          .hero h1 { font-size: 24px; }
          .action-grid { grid-template-columns: 1fr; }
          .status-pills { justify-content: center; }
          .punch-actions { flex-direction: column; }
          .punch-button { width: 100%; }
          .request-row { padding: 14px 12px; }
          .request-row-subtitle { display: none; }
        }
      `}</style>

      <div className="dashboard-page">
        <div className="dashboard-shell">
          <div className="hero">
            <div className="hero-inner">
              <div>
                <div className="eyebrow">Employee Dashboard</div>
                <h1>Welcome, {user?.name || "Employee"} 👋</h1>
                <p>Manage your attendance, leave and work requests.</p>
              </div>

              <div className="today-status">
                <small>Today's Status</small>
                <strong>{todayStatus}</strong>
              </div>
            </div>
          </div>

          <div className="user-meta">
            <span><b>ID:</b> {user?.id}</span>
            <span><b>Role:</b> {user?.role}</span>
            <span><b>Dept:</b> {user?.department || "--"}</span>
            <span><b>DOJ:</b> {user?.joining_date || "--"}</span>
          </div>

          <div className="main-grid">
            <div className="left-column">
              <div className="action-grid">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => {
                    setShowRequestMenu(false);
                    setShowLeaveForm(true);
                    setTimeout(() => {
                      document
                        .getElementById("leave-form")
                        ?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 0);
                  }}
                >
                  ＋ New Request
                </button>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    sessionStorage.clear();
                    navigate("/");
                  }}
                >
                  🚪 Logout
                </button>
              </div>

              <div className="status-pills">
                <span className="pill pending">Pending {myPending}</span>
                <span className="pill approved">Approved {myApproved}</span>
                <span className="pill rejected">Rejected {myRejected}</span>
              </div>

              <div className="metric-grid">
                <div className="metric-card">
                  <strong>{workingHours}</strong>
                  <span>Working Hours</span>
                </div>
                <div className="metric-card">
                  <strong>
                    {todayRecord
                      ? parseAttendanceDate(todayRecord.punch_in).toLocaleTimeString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--"}
                  </strong>
                  <span>Punch In</span>
                </div>
                <div className="metric-card">
                  <strong>
                    {todayRecord?.punch_out
                      ? parseAttendanceDate(todayRecord.punch_out).toLocaleTimeString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--"}
                  </strong>
                  <span>Punch Out</span>
                </div>
              </div>

              <div className="punch-actions">
                <button
                  className="punch-button punch-in"
                  type="button"
                  onClick={handlePunchIn}
                  disabled={punchLoading}
                >
                  🟢 Punch In
                </button>
                <button
                  className="punch-button punch-out"
                  type="button"
                  onClick={handlePunchOut}
                  disabled={punchLoading}
                >
                  🔴 Punch Out
                </button>
              </div>

              <div className="balance-card">
                <div className="balance-grid">
                  <div className="balance-item">CL : {balance?.CL ?? 0}</div>
                  <div className="balance-item">SL : {balance?.SL ?? 0}</div>
                  <div className="balance-item">PL : {balance?.PL ?? 0}</div>
                </div>
              </div>
            </div>

            <div className="calendar-card">
              <h2 className="card-title">
                <span className="card-title-icon">▦</span>
                Attendance Calendar
              </h2>

              <div className="calendar-wrap">
                <Calendar
                  value={new Date()}
                  tileContent={({ date, view }) => {
                    if (view !== "month") return null;

                    const day = date.getDay();

                    if (day === 0 || day === 6) {
                      return (
                        <div style={{ fontSize: 9, color: "#16a36a", fontWeight: 700 }}>
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
                        parseAttendanceDate(a.punch_in).toLocaleDateString("en-CA", {
                          timeZone: "Asia/Kolkata",
                        }) === dateKey
                    );

                    if (attendanceRecord) {
                      return (
                        <div style={{ fontSize: 9, color: "#16a34a", fontWeight: 700 }}>
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
                        <div style={{ fontSize: 9, color: "#7c3aed", fontWeight: 700 }}>
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

                      const requestDate = new Date(request.created_at).toLocaleDateString(
                        "en-CA",
                        { timeZone: "Asia/Kolkata" }
                      );

                      return requestDate === dateKey;
                    });

                    if (approvedWorkRequest) {
                      return (
                        <div style={{ fontSize: 9, color: "#2563eb", fontWeight: 700 }}>
                          {approvedWorkRequest.type}
                        </div>
                      );
                    }

                    if (dateKey < todayKey) {
                      return (
                        <div style={{ fontSize: 9, color: "#dc2626", fontWeight: 700 }}>
                          ABSENT
                        </div>
                      );
                    }

                    return null;
                  }}
                />
              </div>
            </div>

            <div className="requests-card">
              <div className="requests-heading">
                <span>☷</span>
                <span>Requests</span>
              </div>

              {requestRow(
                "👤",
                "My Requests",
                "View your leave, WFH and outdoor requests",
                myRequests.length,
                () => setShowMyRequests(!showMyRequests)
              )}

              {requestRow(
                "👥",
                "Team Leaves",
                "View leaves requested by your team",
                teamLeaves.length,
                () => setShowTeamLeaves(!showTeamLeaves),
                isLeadership
              )}

              {requestRow(
                "💼",
                "Team Work Requests",
                "Approve or reject WFH / Outdoor requests",
                workRequests.filter(
                  (r) => String(r.employee_id) !== String(user?.id)
                ).length,
                () => setShowTeamWorkRequests(!showTeamWorkRequests),
                isLeadership
              )}

              {requestRow(
                "◷",
                "Attendance Regularization",
                "Review regularization requests",
                attendanceRequests.length,
                () => setShowAttendanceRequests(!showAttendanceRequests),
                isLeadership
              )}

              <button
                className="directory-button"
                type="button"
                onClick={() => navigate("/employee-directory")}
              >
                👥 Employee Directory
              </button>
            </div>
          </div>

          {showRequestMenu && (
            <div className="detail-card" style={{ marginTop: 18 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestMenu(false);
                    setShowLeaveForm(true);
                  }}
                >
                  📝 Apply Leave
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestMenu(false);
                    handleWorkRequest("WFH");
                  }}
                >
                  🏠 WFH Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestMenu(false);
                    handleWorkRequest("OUTDOOR");
                  }}
                >
                  🚗 Outdoor Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestMenu(false);
                    navigate("/attendance-regularization");
                  }}
                >
                  🕒 Attendance Regularization
                </button>
              </div>
            </div>
          )}

          {showLeaveForm && (
            <div className="leave-form" id="leave-form">
              <h2>📝 Apply Leave</h2>

              <select
                value={type}
                onChange={(e) => setType(e.target.value as LeaveType)}
              >
                <option value="CL">Casual Leave</option>
                <option value="SL">Sick Leave</option>
                <option value="PL">Privilege Leave</option>
              </select>

              <input
                placeholder="Reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />

              <button className="submit-leave" type="button" onClick={handleApplyLeave}>
                {submitting ? "Applying..." : "Submit Leave"}
              </button>
            </div>
          )}

          <div className="detail-section">
            {showMyRequests && (
              <>
                {myRequests.length === 0 ? (
                  <div className="detail-card">No requests found.</div>
                ) : (
                  myRequests.map((request) => {
                    const item = request.data;

                    return (
                      <div className="detail-card" key={request.requestKey}>
                        <h3>
                          {request.requestType === "LEAVE"
                            ? `📝 ${item.type} Leave`
                            : request.requestType === "WFH"
                            ? "🏠 WFH Request"
                            : "🚗 Outdoor Request"}
                        </h3>
                        <p><b>Status:</b> {item.status}</p>
                        {request.requestType === "LEAVE" ? (
                          <>
                            <p><b>From:</b> {new Date(item.from_date).toLocaleDateString("en-IN")}</p>
                            <p><b>To:</b> {new Date(item.to_date).toLocaleDateString("en-IN")}</p>
                            <p><b>Reason:</b> {item.reason}</p>
                          </>
                        ) : (
                          <>
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

            {isLeadership && showTeamLeaves && (
              <>
                {teamLeaves.length === 0 ? (
                  <div className="detail-card">No team leaves found.</div>
                ) : (
                  teamLeaves.map((l) => (
                    <div className="detail-card" key={l.id}>
                      <h3>{l.employees?.name || "Employee"}</h3>
                      <p><b>Type:</b> {l.type}</p>
                      <p><b>Status:</b> {l.status}</p>
                      <p><b>From:</b> {l.from_date}</p>
                      <p><b>To:</b> {l.to_date}</p>
                      <p><b>Reason:</b> {l.reason}</p>

                      {String(l.status).toUpperCase() === "PENDING" &&
                        String(l.employee_id) !== String(user?.id) && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAction(l.id, "APPROVED")}
                            >
                              ✅ Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(l.id, "REJECTED")}
                              style={{ marginLeft: 8 }}
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                    </div>
                  ))
                )}
              </>
            )}

            {isLeadership && showTeamWorkRequests && (
              <>
                {workRequests.filter(
                  (r) => String(r.employee_id) !== String(user?.id)
                ).map((r) => (
                  <div className="detail-card" key={r.id}>
                    <h3>💼 {r.employees?.name || "Employee"}</h3>
                    <p><b>Type:</b> {r.type}</p>
                    <p><b>Status:</b> {r.status}</p>
                    <p>
                      <b>Date:</b>{" "}
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString("en-IN")
                        : "--"}
                    </p>

                    {String(r.status).toUpperCase() === "PENDING" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleWorkAction(r.id, "APPROVED")}
                        >
                          ✅ Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWorkAction(r.id, "REJECTED")}
                          style={{ marginLeft: 8 }}
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </>
            )}

            {isLeadership && showAttendanceRequests && (
              <>
                {attendanceRequests.length === 0 ? (
                  <div className="detail-card">No attendance regularization requests found.</div>
                ) : (
                  attendanceRequests.map((r) => (
                    <div className="detail-card" key={r.id}>
                      <h3>◷ {r.employees?.name || "Employee"}</h3>
                      <p><b>Date:</b> {r.attendance_date}</p>
                      <p><b>Punch In:</b> {r.new_punch_in}</p>
                      <p><b>Punch Out:</b> {r.new_punch_out}</p>
                      <p><b>Reason:</b> {r.reason}</p>
                      <p><b>Status:</b> {r.status}</p>

                      {String(r.status).toUpperCase() === "PENDING" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAttendanceAction(r.id, "APPROVED")}
                          >
                            ✅ Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttendanceAction(r.id, "REJECTED")}
                            style={{ marginLeft: 8 }}
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </>
            )}
          </div>

          <div className="recent-card">
            <div className="recent-header">🧳 Recent Leave Requests</div>

            <div className="recent-table-wrap">
              <table className="recent-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center" }}>
                        No leave requests found.
                      </td>
                    </tr>
                  ) : (
                    recentLeaves.map((leave) => {
                      const from = new Date(leave.from_date);
                      const to = new Date(leave.to_date);
                      const days =
                        Math.floor(
                          (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
                        ) + 1;

                      const status = String(leave.status || "PENDING").toLowerCase();

                      return (
                        <tr key={`recent-${leave.id}`}>
                          <td className="employee-name">
                            {isLeadership
                              ? leave.employees?.name || "Employee"
                              : `${user?.name || "You"} (You)`}
                          </td>
                          <td><span className="type-badge">{leave.type}</span></td>
                          <td>{from.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                          <td>{to.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                          <td>{days}</td>
                          <td>{leave.reason || "--"}</td>
                          <td>
                            <span className={`status-badge ${status}`}>
                              {leave.status}
                            </span>
                          </td>
                          <td>
                            {leave.created_at
                              ? new Date(leave.created_at).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "--"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <button
              className="view-all"
              type="button"
              onClick={() => setShowMyRequests(true)}
            >
              View all leave requests  ›
            </button>
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "space-between",
              color: "#94a3b8",
              fontSize: 12,
            }}
          >
            <span>© 2026 NexusHR. All rights reserved.</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </>
  );
};   // ← Component function close

export default Dashboard;
