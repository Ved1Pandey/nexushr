import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const AdminDashboard = () => {
  const [candidates, setCandidates] = useState<any[]>([]);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
      console.log(data);
      setCandidates(data||[]);
console.log(error);

    if (error) {
      console.log(error);
      return;
    }

    setCandidates(data || []);
  };
const updateStatus = async (
  id: number,
  status: string
) => {
  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.log(error);
    return;
  }

  fetchCandidates();
}; 

  return (
  <div style={{ padding: 20 }}>
    <h1>HR Dashboard ✅</h1>

<div style={{
  display: "flex",
  gap: "20px",
  marginBottom: "20px"
}}>
  <div style={{
    padding: "20px",
    background: "#d4edda",
    borderRadius: "10px"
  }}>
    <h3>Total</h3>
    <h2>{candidates.length}</h2>
  </div>

  <div style={{
    padding: "20px",
    background: "#fff3cd",
    borderRadius: "10px"
  }}>
    <h3>Shortlisted</h3>
    <h2>
      {
        candidates.filter(
          c => c.status === "Shortlisted"
        ).length
      }
    </h2>
  </div>

  <div style={{
    padding: "20px",
    background: "#f8d7da",
    borderRadius: "10px"
  }}>
    <h3>Rejected</h3>
    <h2>
      {
        candidates.filter(
          c => c.status === "Rejected"
        ).length
      }
    </h2>
  </div>
</div>
    <h2>Applications</h2>

    {candidates.map((candidate) => (
      <div
        key={candidate.id}
        style={{
          border: "1px solid gray",
          padding: 10,
          marginBottom: 10,
        }}
      >
<h3>{candidate.candidate_name}</h3>

<p>Email: {candidate.candidate_email}</p>

<p>Job:{candidate.jobs?.title || "Unknown Job"}</p>


<p>Score: {candidate.score}%</p>

<p>Status: {candidate.status}</p>
<br />

<button
  onClick={() =>
    updateStatus(
      candidate.id,
      "Shortlisted"
    )
  }
>
  Shortlist
</button>

<button
  style={{ marginLeft: 10 }}
  onClick={() =>
    updateStatus(
      candidate.id,
      "Rejected"
    )
  }
>
  Reject
</button>

<br />
<br />


{candidate.resume_url && (
  <a
    href={candidate.resume_url}
    target="_blank"
    rel="noreferrer"
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