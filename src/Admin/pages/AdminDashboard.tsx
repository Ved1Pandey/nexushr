import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h2>Admin Dashboard</h2>

      <button onClick={() => navigate("/admin/leave")}>
        Leave Approval
      </button>

      <button onClick={() => navigate("/admin/reimbursement")}>
        Reimbursement
      </button>

      <button onClick={() => navigate("/admin/tickets")}>
        Tickets
      </button>

      <button onClick={() => navigate("/admin/users")}>
        Manage Users
      </button>
    </div>
  );
};

export default AdminDashboard;
