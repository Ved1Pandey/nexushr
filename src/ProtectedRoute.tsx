import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: any) => {
  const token = sessionStorage.getItem("token"); // ✅ FIXED

  if (!token || token === "undefined") {
    return <Navigate to="/" replace />; // ✅ replace important
  }

  return children;
};

export default ProtectedRoute;