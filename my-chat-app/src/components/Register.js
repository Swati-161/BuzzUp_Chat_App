import React, { useState } from "react";
import axios from "axios";

function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", form);
      alert("Registered! Now login.");
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Username" onChange={(e) => setForm({...form, username: e.target.value})} />
      <input placeholder="Email" onChange={(e) => setForm({...form, email: e.target.value})} />
      <input placeholder="Password" type="password" onChange={(e) => setForm({...form, password: e.target.value})} />
      <button type="submit">Register</button>
    </form>
  );
}

export default Register;
