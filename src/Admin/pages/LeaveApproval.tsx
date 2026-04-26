import { useEffect, useState } from "react";
import { getLeaves } from "../api/leave";

const LeaveApproval = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getLeaves();
        setLeaves(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Leave Approval</h2>

      {leaves.length === 0 ? (
        <p>No leaves found</p>
      ) : (
        leaves.map((leave, i) => (
          <div key={i} style={{ borderBottom: "1px solid #ccc", marginBottom: 10 }}>
            <p><b>Name:</b> {leave.name}</p>
            <p><b>Reason:</b> {leave.reason}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default LeaveApproval;