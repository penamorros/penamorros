# Firebase Setup for Manuel AI Chat

This guide will help you set up Firebase to save and view user input from the Manuel AI avatar chat.

## 🚀 Quick Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "manuel-ai-chat")
4. Follow the setup wizard (you can disable Google Analytics for now)
5. Click "Create project"

### 2. Enable Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for now)
4. Select a location close to you
5. Click "Done"

### 3. Get Your Firebase Configuration

1. In your Firebase project, click the gear icon ⚙️ and select "Project settings"
2. Scroll down to "Your apps" section
3. Click the web icon `</>` to add a web app
4. Enter an app nickname (e.g., "Manuel AI Chat")
5. Click "Register app"
6. Copy the Firebase configuration object

### 4. Update Your Firebase Configuration

1. Open `src/firebase.ts` in your project
2. Replace the placeholder values with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id",
  measurementId: "G-XXXXXXXXXX"
};
```

### 5. Set Up Firestore Security Rules (Optional but Recommended)

1. Go to Firestore Database → Rules
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to chat messages
    match /chatMessages/{document} {
      allow read, write: if true; // For now, allow all access
    }
    
    // Allow read/write access to chat sessions
    match /chatSessions/{document} {
      allow read, write: if true; // For now, allow all access
    }
  }
}
```

3. Click "Publish"

## 📊 Viewing Chat Data

### Access the Admin Dashboard

1. Start your development server: `npm run dev`
2. Open your browser and go to: `http://localhost:5173/?admin=true`
3. You'll see the admin dashboard with two tabs:
   - **Messages**: Shows individual chat messages
   - **Sessions**: Shows complete chat sessions

### What You'll See

- **User Messages**: All messages sent by users to the Manuel AI chat
- **AI Responses**: All responses from the Manuel AI avatar
- **Session IDs**: Unique identifiers for each chat session
- **Timestamps**: When each message was sent
- **Error Messages**: Any errors that occurred during chat

## 🔧 How It Works

### Data Structure

The chat data is stored in two Firestore collections:

1. **`chatMessages`**: Individual messages
   ```typescript
   {
     role: 'user' | 'assistant',
     content: string,
     timestamp: Timestamp,
     sessionId: string
   }
   ```

2. **`chatSessions`**: Complete chat sessions
   ```typescript
   {
     id: string,
     messages: ChatMessage[],
     createdAt: Timestamp,
     lastUpdated: Timestamp
   }
   ```

### Automatic Saving

- Every user message is automatically saved to Firebase
- Every AI response is automatically saved to Firebase
- Error messages are also saved for debugging
- Each chat session gets a unique ID

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔒 Security Considerations

For production use, consider:

1. **Authentication**: Add Firebase Authentication
2. **Security Rules**: Implement proper Firestore security rules
3. **Rate Limiting**: Add rate limiting to prevent spam
4. **Data Retention**: Set up automatic cleanup of old messages

## 🐛 Troubleshooting

### Common Issues

1. **"Firebase not configured" error**
   - Make sure you've updated the config in `src/firebase.ts`
   - Check that all required fields are filled

2. **"Permission denied" error**
   - Check your Firestore security rules
   - Make sure Firestore is enabled in your Firebase project

3. **Messages not appearing in admin dashboard**
   - Check the browser console for errors
   - Verify Firebase configuration is correct
   - Make sure you're accessing the admin page with `?admin=true`

### Debug Mode

Open browser developer tools (F12) and check the console for:
- `💾 User message saved to Firebase`
- `💾 AI response saved to Firebase`
- `🆔 New chat session started: [session-id]`

## 📱 Mobile Access

You can also access the admin dashboard on mobile by visiting:
`https://your-domain.com/?admin=true`

## 🎯 Next Steps

1. Set up proper authentication
2. Add user analytics and insights
3. Implement message filtering and search
4. Add export functionality for chat data
5. Set up automated backups

---

**Need help?** Check the browser console for error messages or review the Firebase documentation.
