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
  };

  getUser();
}, []);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {

  if (!file) {
    alert("Choose resume first ❌");
    return;
  }

  const fileName = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("resumes")
    .upload(fileName, file);

  if (error) {
    alert(error.message);
    return;
  }

  const { data } = supabase.storage
    .from("resumes")
    .getPublicUrl(fileName);

  const resumeUrl = data.publicUrl;

  await supabase
    .from("resumes")
    .insert([
      {
        email: user?.email,
        resume_url: resumeUrl,
      },
    ]);

  alert("Resume uploaded ✅");
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
    </div>
  );
};

export default CandidateDashboard;