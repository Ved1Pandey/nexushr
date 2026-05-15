import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const CandidateDashboard = () => {
const [user, setUser] = useState<any>(null);
useEffect(() => {
  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    if (user?.email) {
      fetchProfile(user.email);
    }
  };

  getUser();
}, []);

  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState("");
  const fetchProfile = async (email: string) => {
  const { data, error } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("email", email)
    .single();

  console.log("PROFILE:", data);
  console.log("PROFILE ERROR:", error);

  setProfile(data);
  const requiredSkills = [
  "SAP SD",
  "Excel",
  "Power BI",
  "Order Management",
  "Accounting",
];

const resumeText =
  (data?.resume_text || "").toLowerCase();

const missing = requiredSkills.filter(
  (skill) =>
    !resumeText.includes(skill.toLowerCase())
);

setMissingSkills(missing);
let strengths: string[] = [];

if (resumeText.includes("sap sd")) {
  strengths.push("SAP SD");
}

if (resumeText.includes("excel")) {
  strengths.push("Excel");
}

if (resumeText.includes("power bi")) {
  strengths.push("Power BI");
}

if (resumeText.includes("order management")) {
  strengths.push("Order Management");
}

const analysisText = `
Strong in: ${strengths.join(", ") || "No major strengths detected"}.

Missing Skills:
${missing.join(", ") || "None"}.
`;

setAnalysis(analysisText);

};

const handleUpload = async () => {

  if (!file) {
    alert("Choose resume first ❌");
    return;
  }

  const fileName = `${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(fileName, file);

  if (uploadError) {
    console.log(uploadError);
    alert(uploadError.message);
    return;
  }

  const { data } = supabase.storage
    .from("resumes")
    .getPublicUrl(fileName);

  const resumeUrl = data.publicUrl;
const { data: insertedData, error: insertError } = await supabase
  .from("candidate_profiles")
  .insert([
    {
      name: user?.email?.split("@")[0],
      email: user?.email,
      phone: "9999999999",
      resume_url: resumeUrl,
    },
  ])
  .select();

console.log("INSERT DATA:", insertedData);
console.log("INSERT ERROR:", insertError);
console.log("INSERT DATA:", insertedData);

if (insertError) {
  alert(insertError.message);
  return;
}

alert("Resume uploaded ✅");
fetchProfile(user.email);
};
  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome Candidate ✅</h1>

      <h3>Upload Resume</h3>

      <input
        type="file"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
          }
        }}
      />

      <br /><br />

      <button onClick={handleUpload}>
        Upload Resume
      </button>
      <br /><br />

{profile && (
  <div>
    <h2>Candidate Profile</h2>

    <p><b>Name:</b> {profile.name}</p>

    <p><b>Email:</b> {profile.email}</p>

    <p><b>Phone:</b> {profile.phone}</p>

    <p><b>Skills:</b> {profile.skills}</p>
    <h3>Missing Skills:</h3>

<ul>
  {missingSkills.map((skill, index) => (
  
    <li key={index}>
      {skill}
    </li>
  ))}
</ul>
<br />

<h3>AI Resume Analysis:</h3>

<textarea
  value={analysis}
  rows={8}
  cols={60}
  readOnly
/>

    <a
      href={profile.resume_url}
      target="_blank"
    >
      View Resume
    </a>
  </div>
)}
    </div>
  );
};

export default CandidateDashboard;