import { useEffect, useState } from "react";

const BASE_URL = "http://localhost:3001/api";

export default function AttendanceRegularization() {
  const [date, setDate] = useState("");
  const [inTime, setInTime] = useState("");
  const [outTime, setOutTime] = useState("");
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [role, setRole] = useState("");

  const token = sessionStorage.getItem("token");

  useEffect(() => {
    const userData = sessionStorage.getItem("user");

    if (userData) {
      try {
        const user = JSON.parse(userData);
        setRole(user.role || "");
      } catch (err) {
        console.log("USER PARSE ERROR:", err);
      }
    }
  }, []);

  const isManager =
    role.toLowerCase() === "manager" ||
    role.toLowerCase() === "team lead";

  const loadData = async () => {
    if (!token) return;

    try {
      const endpoint = isManager
        ? "/team-attendance-regularization"
        : "/attendance-regularization";

      console.log("ATTENDANCE ENDPOINT:", endpoint);
      console.log("ROLE:", role);

      const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      console.log("ATTENDANCE DATA:", data);

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("LOAD ERROR:", err);
    }
  };

  useEffect(() => {
    if (role) {
      loadData();
    }
  }, [role]);

  const submit = async () => {
    const res = await fetch(`${BASE_URL}/attendance-regularization`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        attendance_date: date,
        new_punch_in: inTime,
        new_punch_out: outTime,
        reason,
      }),
    });

    if (res.ok) {
      alert("Request Submitted");

      setDate("");
      setInTime("");
      setOutTime("");
      setReason("");

      loadData();
    } else {
      alert("Something went wrong");
    }
  };

  const handleAction = async (
    id: number,
    status: "APPROVED" | "REJECTED"
  ) => {
    try {
      const res = await fetch(
        `${BASE_URL}/attendance-regularization/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!res.ok) {
        throw new Error("Action failed");
      }

      alert(`Request ${status}`);
      loadData();
    } catch (err) {
      console.log(err);
      alert("Something went wrong");
    }
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "30px auto",
        background: "#fff",
        padding: 25,
        borderRadius: 15,
        boxShadow: "0 5px 20px rgba(0,0,0,.08)",
      }}
    >
      <h2>Attendance Regularization</h2>

      {!isManager && (
        <>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={input}
          />

          <input
            type="datetime-local"
            value={inTime}
            onChange={(e) => setInTime(e.target.value)}
            style={input}
          />

          <input
            type="datetime-local"
            value={outTime}
            onChange={(e) => setOutTime(e.target.value)}
            style={input}
          />

          <textarea
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              ...input,
              height: 90,
            }}
          />

          <button
            onClick={submit}
            style={{
              background: "#f59e0b",
              color: "#fff",
              border: "none",
              padding: "12px 24px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Submit Request
          </button>
        </>
      )}

      <h3 style={{ marginTop: 35 }}>
        {isManager ? "Team Attendance Requests" : "My Requests"}
      </h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 15,
        }}
      >
        <thead>
          <tr style={{ background: "#f59e0b", color: "#fff" }}>
            {isManager && <th style={th}>Employee</th>}
            <th style={th}>Date</th>
            <th style={th}>Punch In</th>
            <th style={th}>Punch Out</th>
            <th style={th}>Reason</th>
            <th style={th}>Status</th>
            {isManager && <th style={th}>Action</th>}
          </tr>
        </thead>

        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              {isManager && (
                <td style={td}>{r.employees?.name || "Unknown"}</td>
              )}

              <td style={td}>{r.attendance_date}</td>
              <td style={td}>{r.new_punch_in}</td>
              <td style={td}>{r.new_punch_out}</td>
              <td style={td}>{r.reason}</td>
              <td style={td}>{r.status}</td>

              {isManager && (
                <td style={td}>
                  {r.status?.toUpperCase() === "PENDING" ? (
                    <>
                      <button
                        onClick={() =>
                          handleAction(r.id, "APPROVED")
                        }
                      >
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          handleAction(r.id, "REJECTED")
                        }
                        style={{ marginLeft: 8 }}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    "-"
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const input = {
  width: "100%",
  padding: 12,
  marginBottom: 15,
  border: "1px solid #ddd",
  borderRadius: 8,
  fontSize: 15,
};

const th = {
  padding: 12,
};

const td = {
  padding: 12,
  borderBottom: "1px solid #eee",
};
