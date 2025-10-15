import React, { useState, useEffect } from 'react';
import { chatService, ChatMessage, ChatSession } from '../services/chatService';

const ChatAdmin: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'sessions'>('messages');

  const loadMessages = async () => {
    setLoading(true);
    try {
      const recentMessages = await chatService.getRecentMessages(100);
      setMessages(recentMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      const recentSessions = await chatService.getRecentSessions(50);
      setSessions(recentSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'messages') {
      loadMessages();
    } else {
      loadSessions();
    }
  }, [activeTab]);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1>Manuel AI Chat - Admin Dashboard</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('messages')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: activeTab === 'messages' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'messages' ? 'white' : 'black',
            border: '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Messages ({messages.length})
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'sessions' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'sessions' ? 'white' : 'black',
            border: '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Sessions ({sessions.length})
        </button>
        <button
          onClick={activeTab === 'messages' ? loadMessages : loadSessions}
          style={{
            padding: '10px 20px',
            marginLeft: '20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {activeTab === 'messages' && (
        <div>
          <h2>Recent Messages</h2>
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '5px',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            {messages.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center' }}>No messages found</p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id || index}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    backgroundColor: message.role === 'user' ? '#f8f9fa' : '#e3f2fd'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <strong style={{ 
                      color: message.role === 'user' ? '#dc3545' : '#007bff' 
                    }}>
                      {message.role === 'user' ? '👤 User' : '🤖 Manuel AI'}
                    </strong>
                    <small style={{ color: '#666' }}>
                      {formatTimestamp(message.timestamp)}
                    </small>
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Session:</strong> {message.sessionId}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div>
          <h2>Recent Chat Sessions</h2>
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '5px',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            {sessions.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center' }}>No sessions found</p>
            ) : (
              sessions.map((session, index) => (
                <div
                  key={session.id}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong>Session ID: {session.id}</strong>
                    <small style={{ color: '#666' }}>
                      Last updated: {formatTimestamp(session.lastUpdated)}
                    </small>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Created:</strong> {formatTimestamp(session.createdAt)}
                  </div>
                  <div>
                    <strong>Messages ({session.messages.length}):</strong>
                    <div style={{ 
                      marginTop: '10px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      backgroundColor: 'white',
                      padding: '10px',
                      borderRadius: '3px',
                      border: '1px solid #ddd'
                    }}>
                      {session.messages.map((msg, msgIndex) => (
                        <div key={msgIndex} style={{ 
                          marginBottom: '10px',
                          padding: '8px',
                          backgroundColor: msg.role === 'user' ? '#fff3cd' : '#d1ecf1',
                          borderRadius: '3px'
                        }}>
                          <strong>{msg.role === 'user' ? '👤 User' : '🤖 AI'}:</strong>
                          <div style={{ marginTop: '5px', fontSize: '14px' }}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatAdmin;
