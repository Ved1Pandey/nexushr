import { useEffect, useState } from "react";

export default function Applications() {
  const [applications, setApplications] = useState([]);

useEffect(() => {
  fetch("http://localhost:3001/api/applications")
    .then((res) => res.json())
    .then((data) => setApplications(data))
    .catch(console.error);
}, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Applications</h2>

      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Score</th>
            <th>Status</th>
            <th>Resume</th>
          </tr>
        </thead>

        <tbody>
          {applications.map((app: any) => (
            <tr key={app.id}>
              <td>{app.candidate_name}</td>
              <td>{app.candidate_email}</td>
              <td>{app.score}</td>
              <td>{app.status}</td>
              <td>
                <a
                  href={app.resume_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Resume
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}