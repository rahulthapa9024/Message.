import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore"; 
// Updated import: Changed 'Image' to 'Plus' for the attachment button
import { Plus, Send, X } from "lucide-react"; 
import toast from "react-hot-toast";

// --- The component now accepts the external 'isBlocked' prop ---
const MessageInput = ({ isBlocked }) => { 
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  // Local state to prevent duplicate submissions
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const fileInputRef = useRef(null);
  
  const { sendMessage } = useChatStore(); 

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  const handleSendMessage = async (e) => {
    e.preventDefault();
    const contentPresent = text.trim() || imagePreview;

    // 1. CRITICAL CHECK: Exit if blocked, submitting, or no content.
    if (isBlocked) {
        toast.error("You cannot send messages to a blocked user.");
        return;
    }
    if (isSubmitting || !contentPresent) return; 

    // 2. Set local state to true instantly to disable the UI.
    setIsSubmitting(true);

    try {
      // 3. Perform the asynchronous store action.
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      // 4. Clear form on success
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (error) {
      // Handle the error (sendMessage in store already handles toast)
      console.error("Failed to send message:", error);
    } finally {
      // 5. Always reset local state after the operation is complete.
      setIsSubmitting(false); 
    }
  };

  // Combine ALL disable conditions:
  // 1. External block state (isBlocked)
  // 2. Internal submitting state (isSubmitting)
  // 3. Content check (no content)
  const isDisabled = isBlocked || isSubmitting || (!text.trim() && !imagePreview);
  
  // Determine placeholder text
  const placeholderText = isBlocked 
    ? "Unblock user to send messages." 
    : "Type a message...";

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
              // Disable if submitting OR blocked
              disabled={isSubmitting || isBlocked} 
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder={placeholderText} // Dynamic placeholder
            value={text}
            onChange={(e) => setText(e.target.value)}
            // Disable if submitting OR blocked
            disabled={isSubmitting || isBlocked} 
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-primary/70" : "text-zinc-400"}`} // Adjusted color for Plus context
            onClick={() => fileInputRef.current?.click()}
            // Disable if submitting OR blocked
            disabled={isSubmitting || isBlocked} 
          >
            <Plus size={20} /> {/* Changed to Plus icon */}
          </button>
        </div>
        <button
          type="submit"
          className={`btn btn-sm btn-circle ${isDisabled ? 'opacity-50' : 'btn-primary'}`}
          // Use the combined disabled state
          disabled={isDisabled} 
        >
          {/* Show spinner when local state is submitting, otherwise show Send icon */}
          {isSubmitting ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <Send size={22} />
          )}
        </button>
      </form>
    </div>
  );
};
export default MessageInput; 