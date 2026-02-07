import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Assuming 'login' handles any form validation internally,
    // otherwise, validation should be added here.
    login(formData);
  };

  return (
    // Increased overall padding and used a min-h-screen for better structure
    <div className="min-h-screen grid lg:grid-cols-2 bg-base-100"> 
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 xl:p-16">
        {/* Added a subtle shadow and rounded corners to the form container for visual depth in dark mode */}
        <div className="w-full max-w-md space-y-8 p-8 sm:p-10 bg-base-200 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30
              transition-colors duration-300 transform group-hover:scale-105" // Made the icon larger and added a subtle transition
              >
                <MessageSquare className="w-7 h-7 text-primary" /> 
              </div>
              <h1 className="text-3xl font-extrabold mt-4 text-base-content">Welcome Back</h1>
              <p className="text-base-content/70">Sign in to your account and get back to work</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content/80">Email Address</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-base-content/50" /> 
                </div>
                {/* Custom focus styles for better feedback */}
                <input
                  type="email"
                  className={`input input-bordered w-full pl-10 bg-base-100 border-base-content/30 focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-control">
              {/* Added a flex container to align label and 'Forgot Password' link */}
              <div className="flex justify-between items-center label pt-0 pb-2">
                <span className="label-text font-semibold text-base-content/80">Password</span>
                {/* Forgot Password Link */}
                <Link 
                    to="/forgot-password" 
                    className="label-text-alt link link-hover text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-base-content/50" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input input-bordered w-full pl-10 bg-base-100 border-base-content/30 focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary w-full h-12 text-lg font-bold mt-8 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Signing In...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="text-center pt-4">
            <p className="text-base-content/70">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="link link-primary font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Pattern (Retained the original component) */}
      <AuthImagePattern
        title={"Welcome back!"}
        subtitle={"Sign in to continue your conversations and catch up with your messages."}
      />
    </div>
  );
};
export default LoginPage;