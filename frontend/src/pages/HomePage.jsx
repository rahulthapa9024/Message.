import React from 'react';
import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    // 1. Outer container spans full width/height. 
    // 2. pt-16 pushes content below a typical fixed Navbar (h-16 or 4rem).
    <div className="bg-base-300">
      
      {/* The main chat interface container. 
        It uses w-full (removes max-width) and calculates its height to fill 
        the exact remaining space (100vh - Navbar_height).
      */}
      <div 
        className="w-full mx-auto shadow-2xl" 
        style={{ height: "calc(100vh - 4rem)" }} // Assuming Navbar is 4rem (h-16) tall
      >
        {/*
          Inner flex container ensures the Sidebar and ChatContainer share the full calculated height.
          Removed rounded-lg for a seamless edge-to-edge feel.
        */}
        <div className="flex h-full overflow-hidden">
          <Sidebar />

          {/* Conditional rendering of chat area */}
          {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
        </div>
      </div>
    </div>
  );
};
export default HomePage;
