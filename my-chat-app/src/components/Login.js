import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login } = useAuth(); 
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", form);
      login(res.data.token); 
      alert("Login successful");
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Email" onChange={(e) => setForm({...form, email: e.target.value})} value={form.email} />
      <input placeholder="Password" type="password" onChange={(e) => setForm({...form, password: e.target.value})} value={form.password}/>
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
