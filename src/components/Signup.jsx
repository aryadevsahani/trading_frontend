import React, { useState } from "react";
import { Card, Form, Button, InputGroup } from "react-bootstrap";
import { User, Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";

const Signup = ({ goToLogin, onSignupSuccess }) => {
  const [showPass, setShowPass] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    username: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Account Created Successfully!");
        window.location.href = '/';
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vh-100 d-flex align-items-center justify-content-center bg-black">
      <Card className="bg-dark border-secondary p-4 shadow-lg text-white fade-in" style={{ width: '380px', borderRadius: '12px' }}>
        <div className="text-center mb-5">
          <h2 className="fw-bold text-info mb-1" style={{ letterSpacing: '2px' }}>CREATE ACCOUNT</h2>
          <p className="text-secondary small">Join the ARYADEV Trading Terminal</p>
        </div>

        <Form onSubmit={handleSignup}>
          {/* Full Name */}
          <Form.Group className="mb-3">
            <Form.Label className="small text-secondary mb-1">FULL NAME</Form.Label>
            <InputGroup className="premium-input">
              <InputGroup.Text className="bg-transparent border-secondary text-secondary pe-0">
                <User size={18} />
              </InputGroup.Text>
              <Form.Control 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="bg-transparent border-secondary text-white shadow-none ps-3" 
                placeholder="John Doe" 
                required 
              />
            </InputGroup>
          </Form.Group>

          {/* Username */}
          <Form.Group className="mb-3">
            <Form.Label className="small text-secondary mb-1">USERNAME</Form.Label>
            <InputGroup className="premium-input">
              <InputGroup.Text className="bg-transparent border-secondary text-secondary pe-0">
                <User size={18} />
              </InputGroup.Text>
              <Form.Control 
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="bg-transparent border-secondary text-white shadow-none ps-3" 
                placeholder="johndoe" 
                required 
              />
            </InputGroup>
          </Form.Group>

          {/* Email */}
          <Form.Group className="mb-3">
            <Form.Label className="small text-secondary mb-1">EMAIL ID</Form.Label>
            <InputGroup className="premium-input">
              <InputGroup.Text className="bg-transparent border-secondary text-secondary pe-0">
                <Mail size={18} />
              </InputGroup.Text>
              <Form.Control 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="bg-transparent border-secondary text-white shadow-none ps-3" 
                placeholder="name@example.com" 
                required 
              />
            </InputGroup>
          </Form.Group>

          {/* Password */}
          <Form.Group className="mb-4">
            <Form.Label className="small text-secondary mb-1">SET PASSWORD</Form.Label>
            <InputGroup className="premium-input">
              <InputGroup.Text className="bg-transparent border-secondary text-secondary pe-0">
                <Lock size={18} />
              </InputGroup.Text>
              <Form.Control 
                type={showPass ? "text" : "password"} 
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="bg-transparent border-secondary text-white shadow-none ps-3" 
                placeholder="••••••••" 
                required 
              />
              <InputGroup.Text className="bg-transparent border-secondary text-secondary ps-2" style={{cursor: 'pointer'}} onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>

          {error && <div className="text-danger text-center mb-3">{error}</div>}

          <Button type="submit" variant="info" className="w-100 fw-bold py-2 mb-3 shadow" disabled={loading}>
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </Button>

          <div className="text-center mt-3 pt-2 border-top border-secondary border-opacity-25">
            <p className="text-secondary small mb-0">
              Already have an account? 
              <span className="text-info ms-2 fw-bold cursor-pointer hover-underline" onClick={goToLogin || (() => window.location.href = '/')} style={{ cursor: 'pointer' }}>
                Login <LogIn size={14} />
              </span>
            </p>
          </div>
        </Form>
      </Card>
      
      <style>{`
        .bg-black { background-color: #0b0e11 !important; }
        .bg-dark { background-color: #161b22 !important; }
        .premium-input .form-control:focus { border-color: #3898ff !important; background: #0d1117 !important; }
        .premium-input .input-group-text { border-right: none; }
        .premium-input .form-control { border-left: none; }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Signup;