import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import AdminDashboard from "./Admin/pages/AdminDashboard";
import ProtectedRoute from "./ProtectedRoute";
import LeaveApproval from "./Admin/pages/LeaveApproval";
import Reimbursement from "./Admin/pages/Reimbursement";
import Tickets from "./Admin/pages/Tickets";
import Users from "./Admin/pages/Users";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>

        <Route
  path="/admin/leave"
  element={
    <ProtectedRoute>
      <LeaveApproval />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/reimbursement"
  element={
    <ProtectedRoute>
      <Reimbursement />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/tickets"
  element={
    <ProtectedRoute>
      <Tickets />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/users"
  element={
    <ProtectedRoute>
      <Users />
    </ProtectedRoute>
  }
/>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
