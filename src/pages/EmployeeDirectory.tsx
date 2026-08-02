import { useEffect, useState } from "react";

const BASE_URL = "http://localhost:3001/api";

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${BASE_URL}/employees`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    })
      .then((r) => r.json())
      .then((data) => setEmployees(Array.isArray(data) ? data : []));
  }, []);

  const filtered = employees.filter((e) =>
    `${e.name} ${e.department} ${e.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "30px auto",
        background: "#fff",
        padding: "25px",
        borderRadius: "16px",
        boxShadow: "0 8px 20px rgba(0,0,0,.08)",
      }}
    >
      <h2 style={{ marginBottom: 20 }}>👥 Employee Directory</h2>

      <input
        type="text"
        placeholder="Search employee..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          marginBottom: "20px",
          fontSize: "15px",
        }}
      />

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#f59e0b",
              color: "#fff",
            }}
          >
            <th style={th}>ID</th>
            <th style={th}>Name</th>
            <th style={th}>Department</th>
            <th style={th}>Role</th>
            <th style={th}>Leave Balance</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((e, i) => (
            <tr
              key={e.id}
              style={{
                background: i % 2 === 0 ? "#fff" : "#fafafa",
              }}
            >
              <td style={td}>{e.id}</td>
              <td style={td}>{e.name}</td>
              <td style={td}>{e.department || "-"}</td>
              <td style={td}>{e.role}</td>
              <td style={td}>
                CL {e.cl} | SL {e.sl} | PL {e.pl}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = {
  padding: "14px",
  textAlign: "left" as const,
};

const td = {
  padding: "14px",
  borderBottom: "1px solid #eee",
};