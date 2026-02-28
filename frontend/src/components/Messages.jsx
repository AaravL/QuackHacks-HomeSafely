import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { messagesService } from '../services/api';
import { initWebSocket, sendWebSocketMessage, closeWebSocket } from '../services/websocket';
import '../styles/Messages.css';

const Messages = () => {
  const { user, messages, addMessage, onlineUsers } = useContext(AppContext);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
      initWebSocket(user.id, handleWebSocketMessage);
    }

    return () => {
      closeWebSocket();
    };
  }, [user]);

  const loadConversations = async () => {
    try {
      const response = await messagesService.getConversations(user.id);
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleSelectConversation = async (otherUserId) => {
    setSelectedConversation(otherUserId);
    setLoading(true);

    try {
      const response = await messagesService.getChatHistory(user.id, otherUserId);
      setChatMessages(response.data);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWebSocketMessage = (data) => {
    if (data.senderId === selectedConversation) {
      setChatMessages((prev) => [...prev, data]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      const newMessage = {
        senderId: user.id,
        recipientId: selectedConversation,
        content: inputValue,
        createdAt: new Date(),
      };

      // Add to local state immediately
      setChatMessages((prev) => [...prev, newMessage]);
      setInputValue('');

      // Send via API
      await messagesService.sendMessage(
        user.id,
        selectedConversation,
        inputValue
      );

      // Send via WebSocket
      sendWebSocketMessage(newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleArchiveChat = async () => {
    try {
      await messagesService.archiveChat(user.id, selectedConversation);
      setSelectedConversation(null);
      loadConversations();
    } catch (error) {
      console.error('Error archiving chat:', error);
    }
  };

  return (
    <div className="messages-container">
      <div className="conversations-list">
        <h2>Messages</h2>
        {conversations.map((conv) => (
          <div
            key={conv.OTHER_USER_ID}
            className={`conversation-item ${
              selectedConversation === conv.OTHER_USER_ID ? 'active' : ''
            }`}
            onClick={() => handleSelectConversation(conv.OTHER_USER_ID)}
          >
            <div className="conversation-header">
              <div className="user-name">User {conv.OTHER_USER_ID}</div>
              <span
                className={`online-status ${
                  onlineUsers.has(conv.OTHER_USER_ID) ? 'online' : 'offline'
                }`}
              />
            </div>
            <p className="last-message">
              {new Date(conv.LAST_MESSAGE_TIME).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>

      <div className="chat-area">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <h3>User {selectedConversation}</h3>
              <span
                className={`online-badge ${
                  onlineUsers.has(selectedConversation) ? 'online' : ''
                }`}
              >
                {onlineUsers.has(selectedConversation) ? 'Online' : 'Offline'}
              </span>
              <button className="btn-archive" onClick={handleArchiveChat}>
                Archive
              </button>
            </div>

            <div className="messages-list">
              {loading ? (
                <p>Loading...</p>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`message ${
                      msg.senderId === user.id ? 'sent' : 'received'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <small>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </small>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="message-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="empty-state">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
