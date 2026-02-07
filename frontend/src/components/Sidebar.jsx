import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();

  const { authUser, onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    // Only fetch users when the component mounts
    getUsers();
  }, [getUsers]);

  // Filter users based on the 'Show online only' checkbox
  // Exclude the currently logged-in user (authUser._id) from the list
  const filteredUsers = users
    .filter(user => user._id !== authUser?._id)
    .filter(user => showOnlineOnly ? onlineUsers.includes(user._id) : true);


  if (isUsersLoading) return <SidebarSkeleton />;

  // --- Updated onClick handler logic ---
  const handleUserClick = (user) => {
    // Only set the user if they are not already the selected user
    if (selectedUser?._id !== user._id) {
      setSelectedUser(user);
    }
  };
  // ------------------------------------

  return (
    // Added 'flex-shrink-0' to prevent the sidebar from being compressed
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200 flex-shrink-0">
      <div className="border-b border-base-300 w-full p-3 lg:p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6 text-primary" />
          <span className="font-semibold text-lg hidden lg:block text-base-content">Contacts</span>
        </div>
        
        {/* Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-primary checkbox-sm" // Used checkbox-primary for better visual theme
            />
            <span className="text-sm text-base-content">Show online only</span>
          </label>
          {/* Note: Subtracting 1 assumes one of the online users is the current logged-in user */}
          <span className="text-xs text-zinc-500">({onlineUsers.length > 0 ? onlineUsers.length - 1 : 0} online)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-2 flex-1">
        {/* User list mapping */}
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => handleUserClick(user)} 
            className={`
              w-full py-3 lg:px-4 flex items-center transition-colors border-l-4 lg:border-l-0
              ${
                // IMPROVED HIGHLIGHTING: distinct primary background and left border for selected state
                selectedUser?._id === user._id 
                  ? "bg-primary/20 text-base-content border-primary" 
                  : "border-transparent hover:bg-base-200"
              }
            `}
          >
            {/* Profile Picture and Status */}
            <div className="relative mx-auto lg:mx-0 w-full lg:w-auto flex justify-center lg:block">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.fullName}
                className="size-12 object-cover rounded-full flex-shrink-0"
              />
              {/* Online status indicator */}
              {onlineUsers.includes(user._id) && (
                <span
                  // Added ring-base-100 (for light/dark mode contrast)
                  className="absolute bottom-0 right-0 lg:right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-base-100"
                />
              )}
            </div>

            {/* User info - only visible on larger screens */}
            <div className="hidden lg:block text-left min-w-0 ml-3 flex-1">
              <div className="font-medium text-base-content truncate">
                {user.fullName}
              </div>
              <div className="text-sm text-zinc-400">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4 px-2 text-sm">
            {showOnlineOnly ? "No other users currently online." : "No users found."}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;