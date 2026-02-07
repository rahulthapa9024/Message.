import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Search, Loader2, Copy, Heart, Mail, Info } from "lucide-react"; // Added Info icon
import toast from "react-hot-toast";

export default function SearchProfile() {
  const {
    searchProfile,
    isSearchingProfile,
    authUser,
    addRequest,
    isFollowingUser,
  } = useAuthStore();

  const [searchId, setSearchId] = useState("");
  const [searchedUser, setSearchedUser] = useState(null);
  const [error, setError] = useState(null);
  const [hasRequested, setHasRequested] = useState(false);

  // Search Handler
  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    setSearchedUser(null);
    setHasRequested(false);

    if (!searchId.trim()) {
      setError("Please enter a User ID to search.");
      return;
    }

    // Prevent searching for own ID
    if (authUser && searchId.trim() === authUser._id) {
        setError("You cannot search for your own ID.");
        return;
    }

    const user = await searchProfile(searchId.trim());
    if (user) {
      setSearchedUser(user);
      // Determine if a request has already been sent/cannot be sent
      setHasRequested(!user.canSendRequest);
    } else {
      setError("User not found or an error occurred during search.");
    }
  };

  // Clear Search
  const handleClear = () => {
    setSearchId("");
    setSearchedUser(null);
    setError(null);
    setHasRequested(false);
  };

  // Send Contact Request
  const handleSendRequest = async () => {
    if (!searchedUser?._id) {
      toast.error("No user found to send request.");
      return;
    }

    try {
      await addRequest(searchedUser._id);
      setHasRequested(true);
      toast.success("Contact request sent successfully!");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "An error occurred while sending request.";
      toast.error(errorMsg);
      console.error("Request API Error:", error);
    }
  };

  // Copy ID
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
        toast.success("User ID copied to clipboard!");
    }).catch(err => {
        toast.error("Failed to copy ID.");
        console.error('Could not copy text: ', err);
    });
  };

  // Determine the request button text and style dynamically
  const requestButtonProps = (() => {
    if (searchedUser && searchedUser._id === authUser?._id) {
      return { 
        text: "Your Profile", 
        disabled: true, 
        className: "btn-outline btn-info cursor-not-allowed", 
        icon: <User className="w-5 h-5" /> 
      };
    }
    if (hasRequested) {
      return { 
        text: searchedUser?.status || "Request Sent", 
        disabled: true, 
        className: "btn-outline btn-disabled cursor-not-allowed", 
        icon: <Mail className="w-5 h-5" fill="currentColor" /> 
      };
    }
    if (isFollowingUser) {
        return {
            text: "Loading...",
            disabled: true,
            className: "btn-primary opacity-70 cursor-not-allowed",
            icon: <Loader2 className="w-5 h-5 animate-spin" />
        };
    }
    return { 
      text: "Send Request", 
      disabled: false, 
      className: "btn-primary hover:bg-primary/90 shadow-md shadow-primary/30", 
      icon: <Mail className="w-5 h-5" fill="none" /> 
    };
  })();


  return (
    // FULL HEIGHT CONTAINER: Added h-full and min-h-[calc(100vh-64px)] 
    // to account for the fixed navbar height (16 units * 4px/unit = 64px)
    <div className="bg-base-300 flex justify-center py-8 sm:py-16 min-h-[calc(100vh-64px)] h-full"> 
      <div className="max-w-4xl w-full mx-4 mt-12 sm:mt-0 sm:mx-auto flex flex-col h-full">
        <div className="bg-base-100 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl space-y-8 border border-primary/20 ring-1 ring-primary/50 flex-grow">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-primary tracking-tight">
              User Directory
            </h1>
            <p className="text-center text-base-content/70 mt-2 text-base sm:text-lg">
              Find and connect with users by their unique platform ID.
            </p>
          </div>

          {/* Search Form */}
          <form className="flex flex-col sm:flex-row gap-4" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Enter User ID (e.g., 65C8...)"
              className="input input-bordered w-full input-lg text-lg focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all duration-300 bg-base-200 text-base-content placeholder-base-content/50"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              disabled={isSearchingProfile}
            />
            <button
              type="submit"
              className={`btn btn-primary btn-lg min-w-[120px] shadow-lg shadow-primary/30 font-bold transition-all duration-300 ${
                isSearchingProfile || !searchId.trim() ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02]"
              }`}
              disabled={isSearchingProfile || !searchId.trim()}
            >
              {isSearchingProfile ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Search className="w-6 h-6" />
                  <span className="hidden sm:inline">Search</span>
                </>
              )}
            </button>
          </form>

          {/* Display Searched User or Initial State/Error */}
          <div className="min-h-[250px] flex items-center justify-center">
            {searchedUser && (
                <div className="card w-full bg-base-200 shadow-xl border border-primary/30 transition-all duration-300 rounded-2xl flex-grow p-6 sm:p-8">
                <div className="card-body p-0 flex flex-col">
                    
                    {/* Header with Clear Button */}
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-base-content/10">
                    <h2 className="text-xl sm:text-2xl text-primary font-bold flex items-center gap-2">
                        <Info className="w-6 h-6 text-primary" /> User Profile Found
                    </h2>
                    <button
                        className="btn btn-sm btn-ghost text-primary hover:bg-primary/10"
                        onClick={handleClear}
                    >
                        New Search
                    </button>
                    </div>

                    <div className="flex items-center gap-6 mb-8 flex-wrap">
                    <img
                        src={
                        searchedUser.profilePic ||
                        "https://placehold.co/96x96/6366f1/ffffff?text=U"
                        }
                        alt={`${searchedUser.fullName}'s Profile`}
                        className="size-24 rounded-full object-cover border-4 border-primary/60 shadow-lg flex-shrink-0"
                    />
                    <div className="flex flex-col flex-grow min-w-[150px] truncate">
                        <p className="text-2xl sm:text-3xl font-extrabold text-base-content truncate">
                        {searchedUser.fullName}
                        </p>
                        <p className="text-sm text-base-content/60 mt-1">
                        Public User Profile Details
                        </p>
                    </div>

                    {/* Request Button (Simplified and centralized logic) */}
                    <button
                        onClick={handleSendRequest}
                        className={`btn btn-md font-semibold transition-colors flex-shrink-0 ${requestButtonProps.className}`}
                        title={requestButtonProps.text}
                        disabled={requestButtonProps.disabled}
                    >
                        {requestButtonProps.icon}
                        <span className="hidden sm:inline">{requestButtonProps.text}</span>
                    </button>
                    </div>

                    <div className="space-y-4 flex-grow">
                    {/* Email */}
                    <div className="flex items-center gap-4 bg-base-300 p-4 rounded-xl transition-shadow duration-300 hover:shadow-lg">
                        <Mail className="w-6 h-6 text-primary flex-shrink-0" />
                        <span className="text-base font-medium text-base-content truncate">
                        {searchedUser.email}
                        </span>
                    </div>
                    
                    {/* Unique ID */}
                    <div className="bg-base-300 p-4 rounded-xl flex flex-col transition-shadow duration-300 hover:shadow-lg">
                        <span className="text-xs text-base-content/60 mb-1 font-semibold uppercase">
                        Unique User ID
                        </span>
                        <div className="flex items-center justify-between gap-2">
                        <code className="text-sm break-all uppercase font-mono text-base-content select-all flex-grow truncate">
                            {searchedUser._id}
                        </code>
                        <button
                            className="btn btn-sm btn-ghost text-primary hover:bg-primary/10 flex-shrink-0"
                            onClick={() => handleCopyId(searchedUser._id)}
                            aria-label="Copy User ID"
                        >
                            <Copy className="w-5 h-5" />
                        </button>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            )}
            
            {/* Error Message */}
            {error && (
                <div className="flex items-center justify-center p-6 bg-error/10 border border-error text-error rounded-xl w-full max-w-sm mx-auto shadow-md">
                    <Info className="w-6 h-6 mr-3" />
                    <p className="font-semibold">{error}</p>
                </div>
            )}
            
            {/* Initial State Message */}
            {!searchedUser && !error && !isSearchingProfile && (
                 <div className="flex flex-col items-center text-center text-base-content/50 py-10">
                    <Search className="w-12 h-12 mb-4" />
                    <p className="text-lg font-medium">Start by entering an ID above.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}