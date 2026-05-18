import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
const Career = () => {
  const [user, setUser] = useState<any>(null);

useEffect(() => {
  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
  };

  getUser();
}, []);
useEffect(() => {

  const fetchJobs = async () => {

    const { data } = await supabase
      .from("Jobs")
      .select("*");

    setJobs(data || []);
  };

  fetchJobs();

}, []);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [score, setScore] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
const [selectedJob, setSelectedJob] = useState("");

  const handleMatch = async () => {
    if (!resumeFile || !selectedJob) {
      alert("Upload resume + enter job description");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("email", "ved@test.com");

      // 1️⃣ Upload resume
      const uploadRes = await fetch("http://localhost:3001/api/upload-resume", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      
   console.log("UPLOAD DATA:", uploadData);

const resumeUrl = uploadData?.publicUrl;

const { data: insertData, error: insertError } = await supabase
  .from("candidate_profiles")
  .upsert(
    [
      {
        name: user?.email?.split("@")[0],
        email: user?.email,
        phone: "",
        resume_url: resumeUrl,
        resume_text: uploadData.text,
        skills: jobDesc,
      },
    ],
    {
      onConflict: "email",
    }
  )
  .select();



console.log("INSERT DATA:", insertData);
console.log("INSERT ERROR:", insertError);


console.log("RESUME TEXT LENGTH:", uploadData.text?.length);

if (!uploadData.text || uploadData.text.length < 50) {
  alert("Resume parsing failed ❌");
  return;
}
 
      // 2️⃣ Match score
console.log("UPLOAD DATA:", uploadData);
const matchRes = await fetch(
  "http://localhost:3001/api/match",
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      text: uploadData.text,
      jobDesc: jobDesc,
      candidateId: uploadData.candidateId,
    }),
  }
);
await matchRes.json();

const skillWeights = {
  "SAP SD": 10,
  "Order Management": 8,
  "OTC": 8,
  "SAP MM": 3,
  "SAP FICO": 3,
  "Excel": 2,
  "Power BI": 2,
};
let matchedWeight = 0;

Object.entries(skillWeights).forEach(([skill, weight]) => {

  if (
    uploadData.text.toLowerCase().includes(skill.toLowerCase()) &&
    jobDesc.toLowerCase().includes(skill.toLowerCase())
  ) {
    matchedWeight += Number(weight);
  }

});

const totalWeight = Object.values(skillWeights).reduce(
  (a, b) => a + Number(b),
  0
);

const finalScore = (
  (matchedWeight / totalWeight) * 100
).toFixed(2);

console.log("FINAL ATS SCORE:", finalScore);

setScore(finalScore);
await supabase
  .from("applications")
  .insert([
    {
      candidate_name: user?.email?.split("@")[0],
      candidate_email: user?.email,
      job_id: selectedJob,
      resume_url: resumeUrl,
      resume_text: uploadData.text,
      score: finalScore,
      status: "Applied",
    },
  ]);

    } catch {
      alert("Error ❌");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Career Page</h2>

      <input
        type="file"
        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
      />

      <br /><br />
<select
  value={selectedJob}
  onChange={(e) => setSelectedJob(e.target.value)}
>

  <option value="">
    Select Job
  </option>

  {jobs.map((job) => (
    <option
      key={job.id}
      value={job.id}
    >
      {job.title}
    </option>
  ))}

</select>

<br /><br />
      <textarea
        placeholder="Paste Job Description"
        value={jobDesc}
        onChange={(e) => setJobDesc(e.target.value)}
      />

      <br /><br />

      <button onClick={handleMatch}>
        Check Match
      </button>

      {score && (
        <h3>Match Score: {score}%</h3>
      )}
    </div>
  );
};

export default Career;
