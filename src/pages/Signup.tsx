import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();


  const handleSignup = async () => {
    try {
      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (error) {
        alert(error.message);
        return;
      }

      // profile save
      await supabase
        .from("candidate_profiles")
        .insert([
          {
            user_id: data.user?.id,
            name,
            phone,
            email,
          },
        ]);

      alert("Signup success ✅");
      navigate("/candidate-dashboard");

    } catch {
      alert("Signup failed ❌");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Candidate Signup</h2>

      <input
        placeholder="Full Name"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
      />

      <br /><br />

      <input
        placeholder="Phone"
        value={phone}
        onChange={(e) =>
          setPhone(e.target.value)
        }
      />

      <br /><br />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
      />

      <br /><br />

      <button onClick={handleSignup}>
        Sign Up
      </button>
    </div>
  );
};

export default Signup;