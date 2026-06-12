import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import Career from "./pages/Career";
import Signup from "./pages/Signup";
import CandidateDashboard from "./pages/CandidateDashboard";
import AdminDashboard from "./Admin/pages/AdminDashboard";
import CreateJob from "./Admin/pages/CreateJob";
import Applications from "./Admin/pages/Applications";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" 
        element={<Login />} />
        <Route path="/career" 
        element={<Career />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
       <Route path="/career" element={<Career />} />
       <Route path="/signup" element={<Signup />} />
       <Route path="/candidate-dashboard"element={<CandidateDashboard />}/>
       <Route path="/admin-dashboard" element={<AdminDashboard />} />
       <Route path="/create-job" element={<CreateJob />}/>
       <Route path="/create-job" element={<CreateJob />} />
       <Route path="/applications" element={<Applications />} />


      </Routes>
    </BrowserRouter>
  );
}


export default App;
