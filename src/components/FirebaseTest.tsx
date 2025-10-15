import React, { useState } from 'react';
import { chatService } from '../services/chatService';

const FirebaseTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testFirebase = async () => {
    setIsLoading(true);
    setTestResult('Testing Firebase connection...');
    
    try {
      // Test saving a message
      const testMessage = {
        role: 'user' as const,
        content: `Test message at ${new Date().toLocaleString()}`,
        sessionId: 'test-session-' + Date.now()
      };
      
      const messageId = await chatService.saveMessage(testMessage);
      
      if (messageId) {
        setTestResult(`✅ SUCCESS: Message saved with ID: ${messageId}`);
      } else {
        setTestResult('⚠️ WARNING: Message save returned empty ID (Firebase might not be working)');
      }
    } catch (error) {
      setTestResult(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '5px',
      margin: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🔥 Firebase Connection Test</h3>
      <button 
        onClick={testFirebase}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? 'Testing...' : 'Test Firebase Connection'}
      </button>
      
      {testResult && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px',
          backgroundColor: testResult.includes('✅') ? '#d4edda' : 
                          testResult.includes('❌') ? '#f8d7da' : '#fff3cd',
          border: `1px solid ${testResult.includes('✅') ? '#c3e6cb' : 
                              testResult.includes('❌') ? '#f5c6cb' : '#ffeaa7'}`,
          borderRadius: '3px'
        }}>
          {testResult}
        </div>
      )}
      
      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <p><strong>Instructions:</strong></p>
        <ol>
          <li>Click "Test Firebase Connection" above</li>
          <li>Check the result - it should show ✅ SUCCESS if working</li>
          <li>If it shows ❌ ERROR, check your Firebase console for issues</li>
          <li>Go to <a href="https://console.firebase.google.com/" target="_blank">Firebase Console</a> to see if the test message appears</li>
        </ol>
      </div>
    </div>
  );
};

export default FirebaseTest;
