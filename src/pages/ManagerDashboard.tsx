import { useNavigate } from "react-router-dom";

const ManagerDashboard = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "30px" }}>
      <h1>Manager Dashboard</h1>

      <p style={{ marginBottom: 25 }}>
        Team management panely
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
        }}
      >
        <button
          onClick={() => navigate("/employee-directory")}
          style={btn}
        >
          Employee Directory
        </button>

        <button
          onClick={() => navigate("/team-leaves")}
          style={btn}
        >
          Team Leave Requests
        </button>

        <button
          onClick={() => navigate("/attendance-regularization")}
          style={btn}
        >
          Attendance Requests
        </button>

        <button
          onClick={() => navigate("/payroll")}
          style={btn}
        >
          Employee Payslips
        </button>

        <button
          onClick={() => navigate("/dashboard")}
          style={btn}
        >
          My Dashboard
        </button>
      </div>
    </div>
  );
};

const btn = {
  padding: "18px",
  border: "none",
  borderRadius: "10px",
  background: "#f59e0b",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

export default ManagerDashboard;
