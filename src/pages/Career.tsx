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

    const { data, error } = await supabase
  .from("jobs")
  .select("*");

console.log("JOBS:", data);
console.log("JOBS ERROR:", error);

setJobs(data || []);


    setJobs(data || []);
  };

  fetchJobs();

}, []);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [score, setScore] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
const [selectedJob, setSelectedJob] = useState("");
const selectedJobData = jobs.find(
  (job) => job.id == selectedJob
);

  const handleMatch = async () => {
    if (!resumeFile || !selectedJob) {
      alert("Upload resume + select job");
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
console.log("UPLOAD DATA FULL:", uploadData);
console.log("RESUME URL:", resumeUrl);


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
        skills: selectedJobData?.description,
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
console.log("RESUME TEXT:");
console.log(uploadData.text);

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
      jobDesc: jobs.find((j) => j.id == 
      selectedJob)?.description || "",
      candidateId: uploadData.candidateId,
    }),
  }
);
const matchData = await matchRes.json();

console.log("MATCH API:", matchData);

setScore(matchData.score);

const { data: appData, error: appError } = await supabase
  .from("applications")
  .insert([
    {
      candidate_name: user?.email?.split("@")[0],
      candidate_email: user?.email,
      job_id: selectedJob,
      resume_url: resumeUrl,
      score: matchData.score,
      status: "Applied",
    },
  ])
  .select();

console.log("APP DATA:", appData);
console.log("APP ERROR:", appError);



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
