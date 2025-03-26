import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous errors

    try {
      const response = await fetch("http://127.0.0.1:8000/api/users/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ 
          username: email,  // Django backend uses username, so we'll use email as username
          email: email,
          password: password 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Fetch additional user profile information
        const profileResponse = await fetch(
          `http://127.0.0.1:8000/api/profiles/?username=${email}`, 
          {
            method: "GET",
            headers: { 
              "Content-Type": "application/json" 
            }
          }
        );

        const profiles = await profileResponse.json();
        
        // Determine user role
        let role = 'user';
        if (profiles.length > 0) {
          // Check if user is a landlord
          const landlordResponse = await fetch(
            `http://127.0.0.1:8000/api/landlords/?search=${email}`, 
            {
              method: "GET",
              headers: { 
                "Content-Type": "application/json" 
              }
            }
          );
          const landlords = await landlordResponse.json();

          // Check if user is a tenant
          const tenantResponse = await fetch(
            `http://127.0.0.1:8000/api/tenants/?search=${email}`, 
            {
              method: "GET",
              headers: { 
                "Content-Type": "application/json" 
              }
            }
          );
          const tenants = await tenantResponse.json();

          // Determine role
          if (landlords.length > 0) {
            role = 'landlord';
          } else if (tenants.length > 0) {
            role = 'tenant';
          }
        }

        // Store user data with role in localStorage
        localStorage.setItem("user", JSON.stringify({
          ...data,
          role: role
        }));
        
        // Navigate based on role
        if (role === 'landlord') {
          navigate('/dashboard/landlord');
        } else if (role === 'tenant') {
          navigate('/dashboard/tenant');
        } else {
          navigate('/');
        }
      } else {
        // Set error message from backend
        setError(data.detail || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-300"
          >
            Login
          </button>
        </form>
        <div className="mt-4 text-center">
          <p>
            Don't have an account? 
            <span 
              onClick={() => navigate('/signup')} 
              className="text-blue-500 cursor-pointer hover:underline ml-1"
            >
              Sign Up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;