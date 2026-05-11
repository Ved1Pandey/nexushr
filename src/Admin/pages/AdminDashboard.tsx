import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const AdminDashboard = () => {
  const [candidates, setCandidates] = useState<any[]>([]);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from("candidate_profiles")
      .select("*");
      console.log(data);
console.log(error);

    if (error) {
      console.log(error);
      return;
    }

    setCandidates(data || []);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>HR Dashboard ✅</h1>

      <h2>All Candidates</h2>

      {candidates.map((candidate) => (
        <div
          key={candidate.id}
          style={{
            border: "1px solid gray",
            padding: 10,
            marginBottom: 10,
          }}
        >
          <h3>{candidate.name}</h3>

          <p>Email: {candidate.email}</p>

          <p>Phone: {candidate.phone}</p>

         {candidate.resume_url && (
  <a
    href={candidate.resume_url}
    target="_blank"
  >
    View Resume
  </a>
)}
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;