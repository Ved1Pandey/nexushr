import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Employee = {
  id: number;
  name: string;
};

type SalaryStructure = {
  id: number;
  employee_id: number;
  currency: string;
  basic: number;
  housing_allowance: number;
  transport_allowance: number;
  other_allowance: number;
  employee_deductions: number;
};

const Payroll = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<
    SalaryStructure[]
  >([]);

  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [currency, setCurrency] = useState("INR");
  const [basic, setBasic] = useState("");
  const [housingAllowance, setHousingAllowance] = useState("");
  const [transportAllowance, setTransportAllowance] = useState("");
  const [otherAllowance, setOtherAllowance] = useState("");
  const [employeeDeductions, setEmployeeDeductions] = useState("");

  const [saving, setSaving] = useState(false);
  //const [runningPayroll, setRunningPayroll] = useState(false);
  //const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
  //const [activeTab, setActiveTab] = useState("structure");

  useEffect(() => {
    fetchEmployees();
    fetchSalaryStructures();
    // fetchPayrollHistory();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.log("EMPLOYEE FETCH ERROR:", error);
      return;
    }

    setEmployees(data || []);
  };

  const fetchSalaryStructures = async () => {
    const { data, error } = await supabase
      .from("salary_structures")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log("SALARY STRUCTURE FETCH ERROR:", error);
      return;
    }

    setSalaryStructures(data || []);
  };

  //const fetchPayrollHistory = async () => {
    //const { data, error } = await supabase
      //.from("payroll_history")
      //.select("*")
      //.order("id", { ascending: false });

    //if (error) {
    //console.log("PAYROLL HISTORY FETCH ERROR:", error);
    //return;
    //}

     //setPayrollHistory(data || []);
  //};

  const grossSalary =
    Number(basic || 0) +
    Number(housingAllowance || 0) +
    Number(transportAllowance || 0) +
    Number(otherAllowance || 0);

  const baseNetSalary =
    grossSalary - Number(employeeDeductions || 0);

  const saveSalaryStructure = async () => {
    if (!selectedEmployee) {
      alert("Select employee");
      return;
    }

    if (Number(basic) <= 0) {
      alert("Basic salary required");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("salary_structures")
      .upsert(
        {
          employee_id: Number(selectedEmployee),
          currency,
          basic: Number(basic || 0),
          housing_allowance: Number(housingAllowance || 0),
          transport_allowance: Number(transportAllowance || 0),
          other_allowance: Number(otherAllowance || 0),
          employee_deductions: Number(employeeDeductions || 0),
        },
        {
          onConflict: "employee_id",
        }
      );

    setSaving(false);

    if (error) {
      console.log("SAVE SALARY ERROR:", error);
      alert(error.message);
      return;
    }

    alert("Salary structure saved");

    setSelectedEmployee("");
    setCurrency("INR");
    setBasic("");
    setHousingAllowance("");
    setTransportAllowance("");
    setOtherAllowance("");
    setEmployeeDeductions("");

    fetchSalaryStructures();
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginTop: "6px",
    marginBottom: "14px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxSizing: "border-box" as const,
  };

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <h1>Payroll</h1>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "30px",
          flexWrap: "wrap",
        }}
      >
        <button>Salary Structures</button>
        <button disabled>Run Payroll</button>
        <button disabled>Payroll History</button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "14px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h2>Salary Structure</h2>

          <label>Employee</label>

          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select employee</option>

            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>

          <label>Currency</label>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={inputStyle}
          >
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="AED">AED</option>
          </select>

          <label>Basic</label>

          <input
            type="number"
            value={basic}
            onChange={(e) => setBasic(e.target.value)}
            style={inputStyle}
          />

          <label>Housing Allowance</label>

          <input
            type="number"
            value={housingAllowance}
            onChange={(e) => setHousingAllowance(e.target.value)}
            style={inputStyle}
          />

          <label>Transport Allowance</label>

          <input
            type="number"
            value={transportAllowance}
            onChange={(e) => setTransportAllowance(e.target.value)}
            style={inputStyle}
          />

          <label>Other Allowance</label>

          <input
            type="number"
            value={otherAllowance}
            onChange={(e) => setOtherAllowance(e.target.value)}
            style={inputStyle}
          />

          <label>Employee Deductions</label>

          <input
            type="number"
            value={employeeDeductions}
            onChange={(e) => setEmployeeDeductions(e.target.value)}
            style={inputStyle}
          />

          <div
            style={{
              background: "#fff7ed",
              padding: "16px",
              borderRadius: "10px",
              marginBottom: "16px",
            }}
          >
            <p>
              <strong>Gross Salary:</strong>{" "}
              {currency} {grossSalary.toLocaleString()}
            </p>

            <p>
              <strong>Base Net Salary:</strong>{" "}
              {currency} {baseNetSalary.toLocaleString()}
            </p>
          </div>

          <button
            onClick={saveSalaryStructure}
            disabled={saving}
            style={{
              width: "100%",
              background: "#f59e0b",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {saving ? "Saving..." : "Save Salary Structure"}
          </button>
        </div>

        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "14px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h2>Existing Structures</h2>

          {salaryStructures.length === 0 && (
            <p>No salary structures found.</p>
          )}

          {salaryStructures.map((structure) => {
            const employee = employees.find(
              (item) => item.id === structure.employee_id
            );

            const gross =
              Number(structure.basic || 0) +
              Number(structure.housing_allowance || 0) +
              Number(structure.transport_allowance || 0) +
              Number(structure.other_allowance || 0);

            return (
              <div
                key={structure.id}
                style={{
                  border: "1px solid #eee",
                  padding: "16px",
                  borderRadius: "10px",
                  marginBottom: "12px",
                }}
              >
                <h3>{employee?.name || "Unknown Employee"}</h3>

                <p>
                  Gross: {structure.currency}{" "}
                  {gross.toLocaleString()}
                </p>

                <p>
                  Deductions: {structure.currency}{" "}
                  {Number(
                    structure.employee_deductions || 0
                  ).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Payroll;
