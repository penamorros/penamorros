import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

// Check if Firebase is properly initialized
const isFirebaseAvailable = () => {
  try {
    return db !== null && db !== undefined;
  } catch (error) {
    console.warn('Firebase not available:', error);
    return false;
  }
};

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Timestamp;
  sessionId: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Timestamp;
  lastUpdated: Timestamp;
}

class ChatService {
  private collectionName = 'chatMessages';
  private sessionsCollectionName = 'chatSessions';

  // Save a single message to Firestore
  async saveMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available, skipping message save');
      return '';
    }

    try {
      const messageWithTimestamp = {
        ...message,
        timestamp: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.collectionName), messageWithTimestamp);
      console.log('Message saved with ID: ', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving message: ', error);
      // Don't throw the error, just log it so it doesn't break the chat
      return '';
    }
  }

  // Save a complete chat session
  async saveChatSession(sessionId: string, messages: Omit<ChatMessage, 'id' | 'timestamp'>[]): Promise<void> {
    try {
      const sessionData = {
        id: sessionId,
        messages: messages.map(msg => ({
          ...msg,
          timestamp: Timestamp.now()
        })),
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now()
      };

      await addDoc(collection(db, this.sessionsCollectionName), sessionData);
      console.log('Chat session saved successfully');
    } catch (error) {
      console.error('Error saving chat session: ', error);
      throw error;
    }
  }

  // Get recent messages (for admin viewing)
  async getRecentMessages(limitCount: number = 50): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(db, this.collectionName), 
        orderBy('timestamp', 'desc'), 
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const messages: ChatMessage[] = [];
      
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as ChatMessage);
      });
      
      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting recent messages: ', error);
      throw error;
    }
  }

  // Get recent chat sessions
  async getRecentSessions(limitCount: number = 20): Promise<ChatSession[]> {
    try {
      const q = query(
        collection(db, this.sessionsCollectionName), 
        orderBy('lastUpdated', 'desc'), 
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const sessions: ChatSession[] = [];
      
      querySnapshot.forEach((doc) => {
        sessions.push({
          ...doc.data()
        } as ChatSession);
      });
      
      return sessions;
    } catch (error) {
      console.error('Error getting recent sessions: ', error);
      throw error;
    }
  }

  // Generate a unique session ID
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const chatService = new ChatService();
