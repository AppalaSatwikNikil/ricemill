import React from 'react';
import './ChatWidget.css';

const ChatWidget = () => {
    return (
        <div className="chat-widget">
            <button className="chat-btn" aria-label="Chat with us">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </button>
            <div className="status-dot"></div>
        </div>
    );
};

export default ChatWidget;
