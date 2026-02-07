import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Search, Mail } from "lucide-react";

// --- Confirmation Modal (Unchanged) ---
const LogoutConfirmationModal = ({ onConfirm, onCancel, confirmColor = 'error' }) => {
  // Dynamically set button classes, now including rounded-full for a pill shape
  const confirmBtnClass = `btn btn-${confirmColor} text-${confirmColor}-content hover:bg-${confirmColor}-focus shadow-lg shadow-${confirmColor}/30 rounded-full`;

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box bg-base-200 shadow-2xl border border-primary/20"> 
        <h3 className="font-bold text-xl text-warning flex items-center gap-3">
          <LogOut className="w-6 h-6" /> Confirm Logout
        </h3>
        <p className="py-4 text-base-content/80">
          Are you sure you want to log out of your account? You will need to sign in again to continue chatting.
        </p>
        <div className="modal-action">
          {/* Cancel Button */}
          <button 
            className="btn btn-ghost hover:bg-base-300 text-base-content" 
            onClick={onCancel}
          >
            Cancel
          </button>
          {/* Confirm Button uses the dynamic color and is now rounded-full */}
          <button 
            className={confirmBtnClass}
            onClick={onConfirm}
          >
            Logout
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-base-300/50" onClick={onCancel}></div>
    </div>
  );
};
// ----------------------------------------

// Helper component for uniform link styling - UPDATED TO INCLUDE BADGE
const NavLink = ({ to, icon: Icon, label, ariaLabel, isActive = false, badgeCount = 0 }) => (
  <Link
    to={to}
    aria-label={ariaLabel}
    // Standard link styling
    className={`btn btn-ghost btn-md gap-2 transition-colors duration-200 rounded-lg h-10 relative ${
      isActive ? 'btn-active bg-primary/20 text-primary hover:bg-primary/30' : 'text-base-content/80 hover:bg-base-content/10'
    }`}
  >
    <Icon className="w-5 h-5" />
    
    {/* Badge for Request Count */}
    {badgeCount > 0 && (
        <span className="badge badge-sm badge-error absolute -top-1 -right-1 md:static md:ml-1 md:text-xs">
            {badgeCount > 9 ? '9+' : badgeCount}
        </span>
    )}

    {/* Show label only on medium screens and up */}
    <span className="hidden md:inline">{label}</span> 
  </Link>
);

const Navbar = () => {
  // Assume useAuthStore now exports pendingRequestCount
  const { logout, authUser, pendingRequestCount = 0 } = useAuthStore(); 
  const [isModalOpen, setIsModalOpen] = useState(false);

  // You can optionally pass a color here, e.g., 'warning' or 'secondary'
  const MODAL_CONFIRM_COLOR = 'error'; 

  const handleLogoutClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsModalOpen(false);
    logout();
  };

  const handleCancelLogout = () => {
    setIsModalOpen(false);
  };

  // Content shown only when the user is authenticated
  const authenticatedContent = (
    <>
      <NavLink
        to={"/searchProfile"}
        icon={Search}
        label="Search"
        ariaLabel="Search User Profile"
      />
      <NavLink
        to={"/addRequestPage"}
        icon={Mail}
        label="Requests"
        ariaLabel="Contact Requests"
        // Pass the request count to the NavLink component
        badgeCount={pendingRequestCount} 
      />
      <NavLink
        to={"/profile"}
        icon={User}
        label="Profile"
        ariaLabel="User Profile"
      />

      {/* LOGOUT BUTTON: Shares size/color with other NavLinks for consistency. */}
      <button 
        className={`btn btn-ghost btn-md gap-2 transition-colors duration-200 rounded-lg h-10 
          text-base-content/80 hover:bg-base-content/10 ml-2`} 
        onClick={handleLogoutClick}
        aria-label="Log out of the application"
      >
        <LogOut className="w-5 h-5" />
        <span className="hidden md:inline">Logout</span>
      </button>
    </>
  );

  // Content shown only when the user is NOT authenticated
  const unauthenticatedContent = (
    <Link 
      to="/login" 
      // Changed rounded-lg to rounded-full for the pill-shaped background
      className="btn btn-primary btn-md ml-2 shadow-lg shadow-primary/30 rounded-full font-bold hover:scale-[1.02] transition-transform duration-200"
      aria-label="Sign in to your account"
    >
      Sign In
    </Link>
  );

  return (
    <>
      <header
        // Enhanced header background for better aesthetics
        className="bg-base-100/90 border-b border-base-content/20 sticky w-full top-0 z-40 backdrop-blur-md"
      >
        <div className="container mx-auto px-4 h-16">
          <div className="flex items-center justify-between h-full">
            
            {/* Logo Section - Bolder and more distinct */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
                <div className="size-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
                  <MessageSquare className="w-5 h-5 text-primary-content" />
                </div>
                <h1 className="text-xl font-extrabold tracking-wide text-base-content hidden sm:inline-block">
                  Message.
                </h1>
              </Link>
            </div>

            {/* Navigation & User Actions Container */}
            <div className="flex items-center gap-1 sm:gap-2">
              
              {/* SETTINGS (ALWAYS VISIBLE) */}
              <NavLink
                to={"/settings"}
                icon={Settings}
                label="Settings"
                ariaLabel="Application Settings"
              />

              {/* Conditional Content */}
              {authUser ? authenticatedContent : unauthenticatedContent}
            </div>
          </div>
        </div>
      </header>

      {/* Render the modal ONLY when isModalOpen is true */}
      {isModalOpen && (
        <LogoutConfirmationModal
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
          confirmColor={MODAL_CONFIRM_COLOR} // Pass the dynamic color
        />
      )}
    </>
  );
};

export default Navbar;