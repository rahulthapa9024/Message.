import { useChatStore } from "../store/useChatStore";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, X } from 'lucide-react'; 
import { useState } from 'react'; // Import useState

// --- NEW FullScreenImageModal Component ---
const FullScreenImageModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
            onClick={onClose} // Close when clicking outside the image
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
                aria-label="Close"
            >
                <X size={32} />
            </button>
            <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                <img 
                    src={imageUrl} 
                    alt="Full Screen Media" 
                    className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"
                />
            </div>
        </div>
    );
};
// --- END FullScreenImageModal Component ---


// A utility component to represent a single image card in the grid
// Now it takes an `onImageClick` prop to open the modal
const MediaCard = ({ imageUrl, timestamp, onImageClick }) => {
    return (
        <div 
            className="card w-full bg-base-200 shadow-xl image-full group cursor-pointer"
            onClick={() => onImageClick(imageUrl)} // Open modal on card click
        >
            <figure className="h-48">
                <img 
                    src={imageUrl} 
                    alt="Shared Media" 
                    className="object-cover w-full h-full transition duration-300 group-hover:scale-105"
                />
            </figure>
            <div className="card-body p-3 justify-end bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition duration-300">
                <p className="text-xs text-white/80">
                    {new Date(timestamp).toLocaleString()}
                </p>
                {/* Removed 'View Full' button as card click now handles full screen */}
                {/* <div className="card-actions justify-end">
                    <a 
                        href={imageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-xs btn-primary text-white"
                        aria-label="View full image"
                    >
                        View Full
                    </a>
                </div> */}
            </div>
        </div>
    );
};


export default function MediaPage() {
    const navigate = useNavigate();
    
    // State to control the full-screen modal
    const [fullScreenImageUrl, setFullScreenImageUrl] = useState(null);

    const { messages, selectedUser } = useChatStore();

    const mediaMessages = messages
        .filter(message => message.image)
        .reverse(); 

    const handleBack = () => {
        navigate(-1); 
    };

    const handleImageClick = (imageUrl) => {
        setFullScreenImageUrl(imageUrl);
    };

    const handleCloseFullScreen = () => {
        setFullScreenImageUrl(null);
    };

    if (!selectedUser) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-screen bg-base-100 text-base-content">
                <p>Please select a chat to view media.</p>
                <button onClick={handleBack} className="btn btn-primary mt-4">Go Back</button>
            </div>
        );
    }
    
    return (
        <div className="flex-1 flex flex-col h-screen bg-base-100 transition-colors duration-200">
            
            {/* HEADER */}
            <div className="flex items-center border-b border-base-300 p-3 min-h-[60px] shadow-sm">
                <button 
                    onClick={handleBack}
                    className="p-2 rounded-full hover:bg-base-200 transition text-base-content mr-3"
                    title="Back to Chat"
                >
                    <ArrowLeft size={24} />
                </button>
                <ImageIcon size={24} className="text-primary mr-2" />
                <h2 className="text-xl font-bold text-base-content">
                    Shared Media with {selectedUser.fullName}
                </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
                {mediaMessages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {mediaMessages.map((message) => (
                            <MediaCard 
                                key={message._id}
                                imageUrl={message.image}
                                timestamp={message.createdAt}
                                onImageClick={handleImageClick} // Pass the click handler
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-base-content/70 p-10">
                        <ImageIcon size={48} className="mb-4" />
                        <p className="text-lg">No shared media found in this chat.</p>
                        <p className="text-sm mt-1">Images sent or received will appear here.</p>
                    </div>
                )}
            </div>

            {/* Render the FullScreenImageModal */}
            <FullScreenImageModal 
                imageUrl={fullScreenImageUrl}
                onClose={handleCloseFullScreen}
            />
            
        </div>
    );
}