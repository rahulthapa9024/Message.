import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
// Assuming these are present in your file structure
import ChatHeader from "../components/ChatHeader"; 
import MessageInput from "../components/MessageInput";
import MessageSkeleton from "../components/skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
// Import formatMessageTime and add formatMessageDate
import { formatMessageTime, formatMessageDate } from "../lib/utils";
import toast from "react-hot-toast";
import { useNavigate } from 'react-router-dom';
import { Lock, Unlock, X, MoreVertical, Search, ArrowLeft, Image } from 'lucide-react'; 

// --- Confirmation Modal Component (Kept as is - Fully Responsive) ---
const ConfirmationModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  // Uses DaisyUI/Tailwind classes compatible with any theme
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"> {/* Added p-4 for mobile */}
      <div className="bg-base-100 p-6 rounded-lg shadow-xl max-w-sm w-full transform transition-all border border-base-300">
        <h3 className="text-lg font-bold text-base-content mb-4">Confirm Action</h3>
        <p className="text-sm text-base-content/80 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="btn btn-sm btn-ghost text-base-content border border-base-300 hover:bg-base-300 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-sm btn-error text-white bg-error hover:bg-error-focus rounded-lg transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
// --- End Confirmation Modal Component ---

// --- New Component for Text Highlighting (Kept as is) ---
const HighlightText = ({ text, highlight }) => {
  if (!highlight) return <p className="text-sm">{text}</p>;

  // Split the text based on the highlight term (case-insensitive, global)
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <p className="text-sm break-words"> {/* Added break-words for better mobile wrapping */}
      {parts.map((part, i) =>
        new RegExp(highlight, 'i').test(part) ? (
          <span key={i} className="bg-yellow-400 text-black px-0.5 rounded-sm">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
};
// --- End New Component for Text Highlighting ---

// --- NEW Date Separator Component (Kept as is) ---
const DateSeparator = ({ dateString }) => (
  <div className="flex justify-center my-4 sticky top-[60px] md:top-[60px] z-10"> {/* Adjusted top for sticky positioning */}
    <span 
      className="bg-base-300 text-base-content/90 px-3 py-1 text-xs rounded-full shadow-md backdrop-blur-sm bg-opacity-70"
    >
      {formatMessageDate(dateString)}
    </span>
  </div>
);
// --- End Date Separator Component ---


const ChatContainer = () => {
  const navigate = useNavigate(); 
  
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    setSelectedUser,
  } = useChatStore();

  const {
    authUser,
    blockUser,
    unblockUser,
    checkIfUserBlocked,
    isBlockingUser,
    isUnblockingUser,
  } = useAuthStore();
  
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState({ type: "", userId: null, message: "" });
  
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  // State for search functionality
  const [isSearchActive, setIsSearchActive] = useState(false); 
  const [messageSearchTerm, setMessageSearchTerm] = useState(''); 
  
  const messageEndRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null); // Ref for focusing the search input

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  // Focus search input when search is activated
  useEffect(() => {
    if (isSearchActive) {
      searchInputRef.current?.focus();
    }
  }, [isSearchActive]);

  // Fetch messages and subscribe on selected user change
  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessages(selectedUser._id);
    const cleanup = subscribeToMessages();
    
    // Cleanup function
    return () => unsubscribeFromMessages(cleanup);
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  // --- OPTIMIZED SCROLL TO BOTTOM LOGIC ---
  useEffect(() => {
    // Scroll to the bottom if:
    // 1. We have messages AND
    // 2. We are NOT actively filtering messages via search (or search term is empty).
    const shouldScroll = messages && (!isSearchActive || messageSearchTerm === '');
    
    if (messageEndRef.current && shouldScroll) {
      requestAnimationFrame(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages, isSearchActive, messageSearchTerm]); 
  // ----------------------------------------

  // Check if selected user is blocked by calling the API
  useEffect(() => {
    const fetchBlockedStatus = async () => {
      if (!selectedUser?._id) {
        setIsUserBlocked(false);
        return;
      }

      try {
        const isBlocked = await checkIfUserBlocked(selectedUser._id);
        setIsUserBlocked(isBlocked); 
      } catch (error) {
        setIsUserBlocked(false);
        // console.error("Error checking block status:", error);
      }
    };

    fetchBlockedStatus();
  }, [selectedUser?._id, checkIfUserBlocked]);

  // Handler to block user (opens modal)
  const handleBlockUser = () => {
    if (!selectedUser || !selectedUser._id) {
      toast.error("No user selected to block");
      return;
    }
    setModalAction({
      type: "block",
      userId: selectedUser._id,
      message: `Are you sure you want to block ${selectedUser.fullName}? You will no longer receive their messages.`,
    });
    setShowConfirmModal(true);
    setIsMenuOpen(false); // Close the menu immediately
  };

  // Handler to unblock user (opens modal)
  const handleUnblockUser = () => {
    if (!selectedUser || !selectedUser._id) {
      toast.error("No user selected to unblock");
      return;
    }
    setModalAction({
      type: "unblock",
      userId: selectedUser._id,
      message: `Are you sure you want to unblock ${selectedUser.fullName}? They will be able to send you messages again.`,
    });
    setShowConfirmModal(true);
  };


  // Handler to close the chat (deselect user/navigate)
  const handleCloseChat = () => {
    setSelectedUser(null); 
    // navigate('/chats'); // Example navigation to a chat list if needed
  };

  // --- HANDLER for toggling search input ---
  const handleSearchChat = () => {
    setIsSearchActive(true);
    setIsMenuOpen(false); // Close menu
  };

  const handleCloseSearch = () => {
    setIsSearchActive(false);
    setMessageSearchTerm(''); // Clear search term
  };
  // ---------------------------------------------
  
  // --- HANDLER for media navigation ---
  const handleNavigateToMedia = () => {
    // This is the action for navigating to your media/gallery page
    navigate('/mediaPage');
  };
  // ----------------------------------------


  // Handler to execute the action confirmed in the modal
  const confirmAction = async () => {
    const { type, userId } = modalAction;
    setShowConfirmModal(false);

    if (!userId) return;

    if (type === "block") {
      await blockUser(userId);
      setIsUserBlocked(true); 
      toast.success(`${selectedUser.fullName} blocked.`);
    } else if (type === "unblock") {
      await unblockUser(userId);
      setIsUserBlocked(false); 
      toast.success(`${selectedUser.fullName} unblocked.`);
    }
    // Note: setIsMenuOpen(false) is handled in handleBlockUser, not needed here
  };

  // --- MESSAGE FILTERING LOGIC ---
  // 1. Filter out messages sent by the blocked user if the current user is blocked
  const blockedFilteredMessages = isUserBlocked 
    ? messages.filter(message => message.senderId === authUser._id)
    : messages;
  
  // 2. Apply text search filter if active
  const filteredMessages = messageSearchTerm
    ? blockedFilteredMessages.filter(message => 
        // Only search message text, not images, and ensure message.text exists
        message.text && message.text.toLowerCase().includes(messageSearchTerm.toLowerCase())
      )
    : blockedFilteredMessages;
  // ------------------------------


  if (isMessagesLoading || !selectedUser) {
    return (
      // Added `h-full` and `max-h-full` to ensure it takes the full available space
      <div className="flex-1 flex flex-col overflow-hidden bg-base-100 transition-colors duration-200 h-full max-h-full">
        {/* Placeholder ChatHeader for loading state */}
        <div className="flex justify-between items-center border-b border-base-300 p-2 min-h-[60px]">
            {/* Assuming ChatHeader gracefully handles null/loading selectedUser */}
            <ChatHeader /> 
            <div className="flex items-center space-x-1">
                {/* Placeholder for media button */}
                <div className="size-9 p-2 rounded-full bg-base-200 animate-pulse"></div>
                {/* Placeholder for search button */}
                <div className="size-9 p-2 rounded-full bg-base-200 animate-pulse"></div>
                {/* Placeholder for menu button */}
                <div className="size-9 p-2 rounded-full bg-base-200 animate-pulse"></div>
                {/* Placeholder for close button */}
                <div className="size-9 p-2 rounded-full bg-base-200 animate-pulse"></div>
            </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto"> {/* Ensure message area is scrollable even when loading */}
            <MessageSkeleton count={5} />
        </div>
      </div>
    );
  }

  return (
    // Added `h-full` and `max-h-full` to ensure it takes the full available space
    <div className="flex-1 flex flex-col overflow-hidden bg-base-100 transition-colors duration-200 h-full max-h-full">
      
      {/* HEADER AND MENU/CLOSE CONTAINER */}
      <div className="sticky top-0 z-20 bg-base-100">
        <div className="flex justify-between items-center border-b border-base-300 p-2 min-h-[60px]">
          
          {/* Conditional Header Content: ChatHeader OR Search Input */}
          {isSearchActive ? (
            <div className="flex items-center flex-1 space-x-2">
              <button 
                onClick={handleCloseSearch}
                className="p-1 rounded-full hover:bg-base-200 transition text-base-content flex-shrink-0"
                title="Exit Search"
              >
                <ArrowLeft size={24} />
              </button>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search messages..."
                value={messageSearchTerm}
                onChange={(e) => setMessageSearchTerm(e.target.value)}
                // Full width input on mobile
                className="flex-1 w-full min-w-0 px-4 py-2 bg-base-200 border border-base-300 rounded-lg text-base-content focus:outline-none focus:border-primary transition"
              />
            </div>
          ) : (
            <>
              {/* ChatHeader component (renders the selected user's info, left side) */}
              <ChatHeader />
              
              {/* Search, Kebab Menu and Close Button Container (Right side) */}
              <div className="flex items-center space-x-1 flex-shrink-0"> {/* Added flex-shrink-0 */}

                  {/* --- NEW MEDIA/GALLERY BUTTON --- */}
                  <button 
                      onClick={handleNavigateToMedia} 
                      className="p-2 rounded-full hover:bg-base-200 transition text-base-content"
                      title="View Shared Media"
                  >
                      <Image size={20} /> {/* Updated icon */}
                  </button>
                  {/* ------------------------- */}
                  
                  {/* --- SEARCH BUTTON --- */}
                  <button 
                      onClick={handleSearchChat} 
                      className="p-2 rounded-full hover:bg-base-200 transition text-base-content"
                      title="Search Messages"
                  >
                      <Search size={20} />
                  </button>
                  {/* ------------------------- */}

                  {/* Kebab Menu Button and Dropdown */}
                  <div className="relative" ref={menuRef}>
                    <button 
                      onClick={() => setIsMenuOpen(!isMenuOpen)} 
                      className="p-2 rounded-full hover:bg-base-200 transition text-base-content"
                      title="Chat Options"
                    >
                      <MoreVertical size={20} />
                    </button>
                    
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-base-100 rounded-lg shadow-2xl z-30 border border-base-300 overflow-hidden">
                        
                        {/* --- BLOCK BUTTON (Only show Block if NOT blocked) --- */}
                        {!isUserBlocked && (
                          <button
                            onClick={handleBlockUser}
                            disabled={isBlockingUser}
                            className={`w-full text-left px-4 py-3 text-sm transition duration-150 flex items-center space-x-2 
                              ${isBlockingUser 
                                ? "opacity-70 cursor-not-allowed text-error/70" 
                                : "text-error hover:bg-base-200"}`
                            }
                          >
                            {isBlockingUser ? (
                              <span className="animate-spin mr-2">⚙️</span>
                            ) : (
                              <Lock size={16} className="text-error"/>
                            )}
                            {isBlockingUser ? "Blocking..." : "Block User"}
                          </button>
                        )}
                        
                        
                      </div>
                    )}
                  </div>

                  {/* Close Button */}
                  <button 
                      onClick={handleCloseChat}
                      className="p-2 rounded-full hover:bg-base-200 transition text-base-content"
                      title="Close Chat"
                  >
                      <X size={20} />
                  </button>
              </div>
            </>
          )}

        </div>
        
        {/* --- BLOCKED USER BANNER WITH UNBLOCK OPTION --- */}
        {isUserBlocked && (
          <div className="bg-error/10 text-error p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm border-b border-error/50 space-y-2 sm:space-y-0">
            <div className="flex items-start space-x-2 flex-1 min-w-0">
                <Lock size={16} className="flex-shrink-0 mt-0.5" />
                <span className="font-medium overflow-hidden text-ellipsis">
                  **{selectedUser.fullName}** is blocked. You cannot send messages.
                </span>
            </div>
            <button
              onClick={handleUnblockUser}
              disabled={isUnblockingUser}
              className={`btn btn-sm text-xs border-none transition duration-150 flex-shrink-0 w-full sm:w-auto
                ${isUnblockingUser 
                  ? "bg-error text-white opacity-70 cursor-not-allowed" 
                  : "bg-error text-white hover:bg-error-focus"}`
              }
            >
              {isUnblockingUser ? (
                <span className="animate-spin mr-1">⚙️</span>
              ) : (
                <Unlock size={14} className="mr-1"/>
              )}
              {isUnblockingUser ? "Unblocking..." : "Unblock User"}
            </button>
          </div>
        )}
        {/* --- END BLOCKED USER BANNER --- */}

      </div>
      {/* END HEADER AND MENU/CLOSE CONTAINER */}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        message={modalAction.message}
        onConfirm={confirmAction}
        onCancel={() => setShowConfirmModal(false)}
      />
      
      {/* Search results status message */}
      {isSearchActive && messageSearchTerm && filteredMessages.length === 0 && (
        <div className="bg-base-200/50 text-base-content p-2 text-center text-sm border-b border-base-300 sticky top-[60px] z-10">
          No results found for **"{messageSearchTerm}"** in this chat.
        </div>
      )}

      {/* Main chat messages container - takes remaining height */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 && !messageSearchTerm && (
            <div className="flex justify-center items-center h-full">
                <p className="text-base-content/70">Start the conversation!</p>
            </div>
        )}
        
        {/* Now mapping over filteredMessages */}
        {filteredMessages.map((message, index) => {
          // --- DATE GROUPING LOGIC ---
          const messageDate = new Date(message.createdAt).toDateString();
          const previousMessageDate = index > 0 
            ? new Date(filteredMessages[index - 1].createdAt).toDateString()
            : null;
          
          const showDateSeparator = messageDate !== previousMessageDate || index === 0;
          
          // Determine if this is the last message *in the currently filtered list*
          const isLastMessage = index === filteredMessages.length - 1;
          // ---------------------------
          
          return (
            <div key={message._id}>
              {/* Conditional Date Separator */}
              {showDateSeparator && (
                <DateSeparator dateString={message.createdAt} />
              )}

              {/* Message Bubble */}
              <div
                className={`chat ${
                  message.senderId === authUser._id ? "chat-end" : "chat-start"
                }`}
                // The ref is only applied to the last message of the visible list
                ref={isLastMessage ? messageEndRef : null} 
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border border-base-300 overflow-hidden flex-shrink-0">
                    <img
                      src={
                        message.senderId === authUser._id
                          ? authUser.profilePic || "/avatar.png"
                          : selectedUser.profilePic || "/avatar.png"
                      }
                      alt="profile pic"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
                {/* Responsive chat header text */}
                <div className="chat-header text-xs sm:text-sm text-base-content/70 mb-1">
                  <time className="text-xs opacity-70 ml-1">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
                <div
                  className={`chat-bubble max-w-[80%] md:max-w-xs lg:max-w-md break-words 
                    ${message.senderId === authUser._id
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 text-base-content"
                  } rounded-xl p-3 shadow-md`}
                >
                  {message.image && (
                    <img
                      // Responsive image max width
                      src={message.image}
                      alt="Attachment"
                      className="max-w-full sm:max-w-[250px] md:max-w-[300px] rounded-lg mb-2 cursor-pointer"
                      onClick={() => window.open(message.image, '_blank')}
                    />
                  )}
                  {/* Use the new HighlightText component */}
                  {message.text && (
                    <HighlightText 
                      text={message.text} 
                      highlight={isSearchActive ? messageSearchTerm : ''} 
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MessageInput - remains at the bottom, sticky */}
      <MessageInput isBlocked={isUserBlocked} />
    </div>
  );
};

export default ChatContainer;