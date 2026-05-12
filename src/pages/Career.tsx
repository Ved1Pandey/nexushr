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
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [score, setScore] = useState("");

  const handleMatch = async () => {
    if (!resumeFile || !jobDesc) {
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
  .insert([
    {
      name: user?.email?.split("@")[0],
      email: user?.email,
      phone: "9999999999",
      resume_url: resumeUrl,
    },
  ]);

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


    const matchData = await matchRes.json();

      setScore(matchData.score);

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
