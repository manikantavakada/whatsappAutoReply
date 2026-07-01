export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface BusinessProfile {
  id: string;
  name: string;
  aiEnabled: boolean;
  aiTone: 'friendly' | 'professional' | 'concise';
  welcomeNote: string | null;
  autoReplyDelaySec: number;
  waPhoneNumberId: string | null;
  waBusinessAccountId: string | null;
  waDisplayNumber: string | null;
  waVerifyToken: string;
  waConnectedAt: string | null;
  waConnected: boolean;
}

export interface BusinessOverview {
  aiEnabled: boolean;
  waConnected: boolean;
  totalConversations: number;
  totalMessages: number;
  messagesLast24h: number;
  aiHandledShare: number;
  openHandoffs: number;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  price: string | number;
  imageUrl: string | null;
  sizes: string[];
  colors: string[];
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MessageSender = 'CUSTOMER' | 'AI' | 'HUMAN';

export interface Message {
  id: string;
  businessId: string;
  customerId: string;
  sender: MessageSender;
  content: string;
  failed: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  name: string | null;
  waNumber: string;
  aiPaused: boolean;
  unreadCount: number;
  lastMessageAt: string | null;
  lastMessage: Message | null;
}
