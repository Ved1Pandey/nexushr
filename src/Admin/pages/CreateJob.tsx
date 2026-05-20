import { useState } from "react";
import { supabase } from "../../lib/supabase";

const CreateJob = () => {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createJob = async () => {

    const { data, error } = await supabase
      .from("jobs")
      .insert([
        {
          title,
          description,
        },
      ])
      .select();

    console.log("JOB DATA:", data);
    console.log("JOB ERROR:", error);

    alert("Job Created ✅");
  };

  return (
    <div style={{ padding: 40 }}>

      <h1>Create Job</h1>

      <input
        placeholder="Job Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <br /><br />  

      <textarea
        placeholder="Job Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <br /><br />

      <button onClick={createJob}>
        Create Job
      </button>

    </div>
  );
};

export default CreateJob;