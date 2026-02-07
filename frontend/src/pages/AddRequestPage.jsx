import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Loader2, Copy, UserPlus, Info, UserX } from "lucide-react"; // Added Info, UserX
import toast from "react-hot-toast";

// --- New Component: Confirmation Modal for Deletion (Optional but recommended for better UX) ---
const ActionConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText, isDestructive = false }) => {
    return (
        <div className="modal modal-open z-50">
            <div className="modal-box bg-base-200 shadow-2xl border border-primary/20">
                <h3 className={`font-bold text-xl flex items-center gap-3 ${isDestructive ? 'text-error' : 'text-primary'}`}>
                    {isDestructive ? <UserX className="w-6 h-6" /> : <Info className="w-6 h-6" />} {title}
                </h3>
                <p className="py-4 text-base-content/80">{message}</p>
                <div className="modal-action">
                    <button 
                        className="btn btn-ghost hover:bg-base-300 text-base-content" 
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button 
                        className={`btn ${isDestructive ? 'btn-error text-error-content' : 'btn-primary text-primary-content'}`} 
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop bg-base-300/50" onClick={onCancel}></div>
        </div>
    );
};
// ----------------------------------------

export default function SentRequests() {
  const { getAllAddRequest, isFetchingAddRequests, addUser } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [confirmingUserId, setConfirmingUserId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false); // State for delete action, if implemented

  useEffect(() => {
    const fetchRequests = async () => {
      // Assuming getAllAddRequest now fetches RECEIVED requests (common terminology for this page)
      const data = await getAllAddRequest(); 
      setRequests(data);
    };

    fetchRequests();
  }, [getAllAddRequest]);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
        toast.success("User ID copied to clipboard!");
    }).catch(err => {
        toast.error("Failed to copy ID.");
        console.error('Could not copy text: ', err);
    });
  };

  const handleAccept = async () => {
    if (!confirmingUserId) return;

    // Use a clearer state for pending action if needed, though addUser likely handles loading
    const userIdToAccept = confirmingUserId;
    setConfirmingUserId(null); // Close modal immediately

    const success = await addUser(userIdToAccept);
    if (success) {
      toast.success("Contact request accepted!");
      setRequests((prev) => prev.filter((user) => user._id !== userIdToAccept));
    }
  };

  // Function to initiate the confirmation flow
  const openConfirmModal = (userId) => {
    setConfirmingUserId(userId);
  };
  
  // Function to cancel the confirmation flow
  const closeConfirmModal = () => {
    setConfirmingUserId(null);
  };

  return (
    // Set min-height to take up full screen below Navbar (assuming 64px height)
    <div className="min-h-[calc(100vh-64px)] bg-base-300 flex justify-center py-12 px-4">
      <div className="max-w-4xl w-full mx-auto bg-base-100 p-6 sm:p-10 rounded-3xl shadow-2xl border border-primary/20">
        <h1 className="text-4xl font-extrabold text-primary mb-2 text-center tracking-tight">
          Received Contact Requests
        </h1>
        <p className="text-center text-base-content/70 mb-8 text-lg">
            Approve or deny connection requests from other users.
        </p>

        {/* Loading State */}
        {isFetchingAddRequests && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isFetchingAddRequests && requests.length === 0 && (
            <div className="flex flex-col items-center text-center text-base-content/50 py-16">
                <UserPlus className="w-16 h-16 mb-4 text-primary/50" />
                <p className="text-xl font-medium">You have no pending contact requests.</p>
                <p className="mt-2 text-base">Keep checking back or share your ID with friends!</p>
            </div>
        )}

        {/* Request List */}
        {!isFetchingAddRequests && requests.length > 0 && (
          <ul className="space-y-4">
            {requests.map((user) => (
              <li
                key={user._id}
                className="bg-base-200 p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border border-base-content/10 transition-shadow duration-300 hover:shadow-xl"
              >
                {/* Profile Image */}
                <img
                  src={user.profilePic || "https://placehold.co/64x64/6366f1/ffffff?text=U"}
                  alt={`${user.fullName}'s profile`}
                  className="size-16 sm:size-20 rounded-full object-cover border-4 border-primary/60 flex-shrink-0"
                />
                
                {/* User Info */}
                <div className="flex flex-col flex-grow truncate text-center sm:text-left">
                  <p className="text-xl sm:text-2xl font-bold text-base-content truncate">{user.fullName}</p>
                  <p className="text-base-content/60 text-base truncate">{user.email}</p>
                </div>
                
                {/* Actions & ID */}
                <div className="flex flex-col items-center sm:items-end flex-shrink-0 space-y-2 w-full sm:w-auto mt-4 sm:mt-0">
                  <div className="flex gap-2 w-full justify-center sm:justify-end">
                    
                    {/* Accept Button */}
                    <button
                        onClick={() => openConfirmModal(user._id)} // Open confirmation modal
                        className="btn btn-sm btn-primary flex items-center gap-2 shadow-md shadow-primary/30 w-1/2 sm:w-auto"
                        title="Accept Contact Request"
                    >
                        <UserPlus className="w-4 h-4" />
                        Accept
                    </button>
                    
                    {/* Decline/Copy ID Button Group */}
                    <button
                        onClick={() => handleCopyId(user._id)}
                        className="btn btn-sm btn-ghost text-base-content/60 hover:text-primary hover:bg-primary/10 w-1/2 sm:w-auto"
                        title="Copy User ID"
                    >
                        <Copy className="w-5 h-5" />
                        <span className="hidden sm:inline">Copy ID</span>
                    </button>
                  </div>

                  {/* ID Display */}
                  <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs font-mono text-base-content/60 truncate max-w-[180px] select-all">
                        ID: {user._id}
                      </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmingUserId && (
        <ActionConfirmationModal
            title="Accept Request"
            message={`Are you sure you want to accept the contact request from this user?`}
            onConfirm={handleAccept}
            onCancel={closeConfirmModal}
            confirmText="Yes, Accept"
            isDestructive={false}
        />
      )}
    </div>
  );
}