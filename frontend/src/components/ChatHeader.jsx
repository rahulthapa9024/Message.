import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  // keep structure the same, only responsive Tailwind classes added
  return (
    <div className="px-3 py-2 sm:px-4 sm:py-3 border-b border-base-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="avatar flex-shrink-0">
          <div className="size-10 rounded-full relative overflow-hidden flex-shrink-0 min-[320px]:size-8 sm:size-10 md:size-12">
  <img
    src={selectedUser?.profilePic || "/avatar.png"}
    alt={selectedUser?.fullName || "User"}
    className="w-full h-full object-cover"
  />
</div>
          </div>

          {/* User info */}
          <div className="min-w-0">
            <h3 className="font-medium text-sm sm:text-base truncate">{selectedUser?.fullName}</h3>
            <p className="text-xs sm:text-sm text-base-content/70 truncate">
              {onlineUsers?.includes(selectedUser?._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;