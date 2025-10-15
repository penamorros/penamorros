import React, { useState, useEffect } from 'react';

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState({
    pageViews: 0,
    chatSessions: 0,
    projectClicks: 0,
    contactAttempts: 0,
    themeToggles: 0
  });

  // Simulate analytics data (in real implementation, this would come from GA4 API)
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalyticsData(prev => ({
        pageViews: prev.pageViews + Math.floor(Math.random() * 3),
        chatSessions: prev.chatSessions + Math.floor(Math.random() * 2),
        projectClicks: prev.projectClicks + Math.floor(Math.random() * 2),
        contactAttempts: prev.contactAttempts + Math.floor(Math.random() * 1),
        themeToggles: prev.themeToggles + Math.floor(Math.random() * 1)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>📊 Google Analytics Dashboard</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Page Views</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
            {analyticsData.pageViews}
          </div>
        </div>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Chat Sessions</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
            {analyticsData.chatSessions}
          </div>
        </div>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Project Clicks</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
            {analyticsData.projectClicks}
          </div>
        </div>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Contact Attempts</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545' }}>
            {analyticsData.contactAttempts}
          </div>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#e9ecef', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>🎯 Tracked Events</h3>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li><strong>Page Views:</strong> Automatic tracking of page visits</li>
          <li><strong>Section Navigation:</strong> When users scroll to different sections</li>
          <li><strong>Chat Interactions:</strong> Chat opens, messages sent, AI responses</li>
          <li><strong>Project Clicks:</strong> Live demo and GitHub link clicks</li>
          <li><strong>Contact Attempts:</strong> Email, LinkedIn, and GitHub clicks</li>
          <li><strong>Theme Toggles:</strong> Light/dark mode switches</li>
          <li><strong>Time on Page:</strong> How long users spend on your site</li>
          <li><strong>Button Clicks:</strong> Resume and contact button interactions</li>
        </ul>
      </div>

      <div style={{ 
        backgroundColor: '#d1ecf1', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #bee5eb'
      }}>
        <h3>📈 How to View Real Analytics</h3>
        <ol>
          <li>Go to <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">Google Analytics</a></li>
          <li>Select your property: <strong>studied-source-441116-f4</strong></li>
          <li>Navigate to <strong>Reports → Engagement → Events</strong></li>
          <li>View real-time data in <strong>Reports → Realtime</strong></li>
        </ol>
        
        <p><strong>Measurement ID:</strong> G-QR129FGELF</p>
        <p><strong>Project:</strong> studied-source-441116-f4</p>
      </div>

      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '5px'
      }}>
        <p><strong>💡 Tip:</strong> This dashboard shows simulated data. Check your Google Analytics console for real-time tracking data!</p>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
