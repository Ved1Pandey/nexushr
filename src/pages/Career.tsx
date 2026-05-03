import { useState } from "react";

const Career = () => {
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

      // 1️⃣ Upload resume
      const uploadRes = await fetch("http://localhost:3001/api/upload-resume", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      // 2️⃣ Match score
      const matchRes = await fetch("http://localhost:3001/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: uploadData.text,
          jobDesc,
        }),
      });

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