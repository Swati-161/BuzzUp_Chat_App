import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const { login } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", form);
      login(res.data.token);
      alert("Registration successful!");
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Username" onChange={(e) => setForm({...form, username: e.target.value})} value={form.username}/>
      <input placeholder="Email" onChange={(e) => setForm({...form, email: e.target.value})} value={form.email} />
      <input placeholder="Password" type="password" onChange={(e) => setForm({...form, password: e.target.value})} value={form.password} />
      <button type="submit">Register</button>
    </form>
  );
}

export default Register;
