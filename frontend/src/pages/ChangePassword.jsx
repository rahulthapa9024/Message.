import React, { useState } from "react";
import { axiosInstance } from "../lib/axios";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import AuthImagePattern from "../components/AuthImagePattern"; // Assuming this is the correct path

export default function ChangePassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate(); // Initialize useNavigate

  const handleSendOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      // Basic email validation before API call
      if (!/\S+@\S+\.\S+/.test(email)) {
        setMessage("Invalid email format");
        setLoading(false);
        return;
      }
      
      const { data } = await axiosInstance.post("/auth/send-otp", { email });
      setOtpSent(true);
      setMessage(data.message || "OTP sent successfully! Check your email.");
    } catch (err) {
      // Use optional chaining safely
      setMessage(err.response?.data?.message || "Failed to send OTP. Please check your email.");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      const { data } = await axiosInstance.post("/auth/verify-otp", { email, otp });
      if (data.success) {
        setOtpVerified(true);
        setMessage("✅ OTP verified! Please enter your new password below.");
      } else {
        setMessage(data.message || "❌ Incorrect OTP. Please try again.");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ OTP verification failed.");
    }
    setLoading(false);
  };

  const handleChangePassword = async () => {
    setMessage("");
    if (newPassword !== confirmPassword) {
      setMessage("❌ Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("❌ Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axiosInstance.patch("/auth/changePassword", {
        email,
        newPassword,
      });
      if (data.success) {
        setMessage("🎉 Password changed successfully! Redirecting to Login Page...");
        // Navigate to /signup on success
        setTimeout(() => {
          navigate("/login");
        },1000); 
      } else {
        setMessage(data.message || "❌ Failed to change password.");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Failed to change password.");
    }
    setLoading(false);
  };

  return (
    // Use min-h-screen and apply a base background color
    <div className="min-h-screen grid lg:grid-cols-2 bg-base-100"> 
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 xl:p-16">
        {/* Added shadow, background color, and padding to container for visual depth */}
        <div className="w-full max-w-md space-y-8 p-8 sm:p-10 bg-base-200 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl">
          
          {/* LOGO & Header */}
          <div className="text-center mb-10">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="size-14 rounded-full bg-primary/20 flex items-center justify-center 
              group-hover:bg-primary/30 transition-colors duration-300 transform group-hover:scale-105"
              >
                <Mail className="size-7 text-primary" />
              </div>
              <h1 className="text-3xl font-extrabold mt-4 text-base-content">Change Password</h1>
              <p className="text-base-content/70">Reset your password securely</p>
            </div>
          </div>

          {/* Email Field */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-base-content/80">Email Address</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="size-5 text-base-content/50" />
              </div>
              <input
                type="email"
                className={`input input-bordered w-full pl-10 bg-base-100 border-base-content/30 focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200`}
                placeholder="you@example.com"
                value={email}
                disabled={otpSent}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Send OTP Button */}
          {!otpSent && (
            <button
              onClick={handleSendOtp}
              // Disabled if loading or email is not entered
              disabled={loading || !email.trim()} 
              className="btn btn-primary w-full h-12 text-lg font-bold mt-4 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="size-5 animate-spin mr-2" />
                  Sending OTP...
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          )}

          {/* OTP Input and Verify */}
          {otpSent && !otpVerified && (
            <>
              <div className="form-control mt-6">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/80">Enter OTP</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-base-100 border-base-content/30 focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200"
                  placeholder="e.g. 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6} // Basic length check for OTP
                className="btn btn-primary w-full h-12 text-lg font-bold mt-4 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin mr-2" />
                    Verifying OTP...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </button>
            </>
          )}

          {/* New Password Input */}
          {otpVerified && (
            <>
              {/* New Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/80">New Password</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="size-5 text-base-content/50" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className={`input input-bordered w-full pl-10 bg-base-100 border-base-content/30 focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200`}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-primary transition-colors"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/80">Confirm Password</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="size-5 text-base-content/50" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={`input input-bordered w-full pl-10 bg-base-100 border-base-content/30 focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-primary transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleChangePassword}
                disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                className="btn btn-primary w-full h-12 text-lg font-bold mt-8 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin mr-2" />
                    Changing Password...
                  </>
                ) : (
                  "Change Password"
                )}
              </button>
            </>
          )}

          {/* Message Display */}
          {message && (
            <div 
              className={`mt-4 text-center font-semibold ${message.startsWith('❌') ? 'text-error' : message.startsWith('✅') || message.startsWith('🎉') ? 'text-success' : 'text-base-content/70'}`}
            >
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Replaced with AuthImagePattern for theme consistency */}
      <AuthImagePattern
        title="Secure Password Reset"
        subtitle="Verify your identity with a one-time password and set a new, strong password."
      />
    </div>
  );
}