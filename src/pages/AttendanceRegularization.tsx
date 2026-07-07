import { useEffect, useState } from "react";

const BASE_URL = "http://localhost:3001/api";

export default function AttendanceRegularization() {
  const [date, setDate] = useState("");
  const [inTime, setInTime] = useState("");
  const [outTime, setOutTime] = useState("");
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState<any[]>([]);

  const token = sessionStorage.getItem("token");

  const loadData = async () => {
    const res = await fetch(`${BASE_URL}/attendance-regularization`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadData();
  }, []);

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

      <h3 style={{ marginTop: 35 }}>My Requests</h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 15,
        }}
      >
        <thead>
          <tr style={{ background: "#f59e0b", color: "#fff" }}>
            <th style={th}>Date</th>
            <th style={th}>Punch In</th>
            <th style={th}>Punch Out</th>
            <th style={th}>Status</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td style={td}>{r.attendance_date}</td>
              <td style={td}>{r.new_punch_in}</td>
              <td style={td}>{r.new_punch_out}</td>
              <td style={td}>{r.status}</td>
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
