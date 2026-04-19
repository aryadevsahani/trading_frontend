import React, { useState } from "react";
import { Card, Form, Button, InputGroup, Alert, Spinner } from "react-bootstrap";
import { Mail, Lock, Eye, EyeOff, UserPlus } from "lucide-react"; // User icon ki jagah Mail icon

const Login = ({ onLogin, goToSignup }) => {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email, // Backend requirement match ho gayi
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        onLogin(data);
      } else {
        setError(data.message || "Invalid Email or Password");
      }
    } catch (err) {
      setError("Server connection failed. Please check your backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vh-100 d-flex align-items-center justify-content-center bg-black">
      <Card className="bg-dark border-secondary p-4 shadow-lg text-white fade-in" style={{ width: '380px', borderRadius: '12px' }}>
        <div className="text-center mb-5">
          <h2 className="fw-bold text-info mb-1" style={{ letterSpacing: '2px' }}>ARYADEV</h2>
          <p className="text-secondary small">Login with your registered email</p>
        </div>

        {error && (
          <Alert variant="danger" className="py-2 small bg-transparent text-danger border-danger mb-4">
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Email Address */}
          <Form.Group className="mb-3">
            <Form.Label className="small text-secondary mb-1">EMAIL ADDRESS</Form.Label>
            <InputGroup className="premium-input">
              <InputGroup.Text className="bg-transparent border-secondary text-secondary pe-0">
                <Mail size={18} />
              </InputGroup.Text>
              <Form.Control 
                type="email"
                className="bg-transparent border-secondary text-white shadow-none ps-3" 
                placeholder="Ex: name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </InputGroup>
          </Form.Group>

          {/* Password */}
          <Form.Group className="mb-4">
            <Form.Label className="small text-secondary mb-1">PASSWORD</Form.Label>
            <InputGroup className="premium-input">
              <InputGroup.Text className="bg-transparent border-secondary text-secondary pe-0">
                <Lock size={18} />
              </InputGroup.Text>
              <Form.Control 
                type={showPass ? "text" : "password"}
                className="bg-transparent border-secondary text-white shadow-none ps-3" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <InputGroup.Text 
                className="bg-transparent border-secondary text-secondary ps-2" 
                style={{cursor: 'pointer'}}
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>

          <Button 
            type="submit" 
            variant="info" 
            className="w-100 fw-bold py-2 mb-3 shadow d-flex align-items-center justify-content-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                LOGGING IN...
              </>
            ) : (
              "LOGIN"
            )}
          </Button>

          <div className="text-center mt-3 pt-2 border-top border-secondary border-opacity-25">
            <p className="text-secondary small mb-0">
              Don't have an account? 
              <span 
                className="text-info ms-2 fw-bold cursor-pointer hover-underline d-inline-flex align-items-center gap-1"
                onClick={goToSignup}
                style={{ cursor: 'pointer' }}
              >
                Register <UserPlus size={14} />
              </span>
            </p>
          </div>
        </Form>
      </Card>

      <style>{`
        .bg-black { background-color: #0b0e11 !important; }
        .bg-dark { background-color: #161b22 !important; }
        .premium-input .form-control:focus {
          border-color: #0dcaf0 !important;
          background: #0d1117 !important;
        }
        .premium-input .input-group-text { border-right: none; }
        .premium-input .form-control { border-left: none; }
        .hover-underline:hover { text-decoration: underline; }
        .fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Login;