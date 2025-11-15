// User types
export type UserRole = 'admin' | 'leader' | 'customer_service';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserWithRole extends User {
  role: UserRole;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

// Message types
export interface Message {
  id: string;
  direction: 'incoming' | 'outgoing';
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  isGroup: boolean;
  chatName?: string;
  contactName?: string;
}

export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageAt?: Date;
}

export interface MessageHistory {
  chatId: string;
  messages: Message[];
  hasMore: boolean;
  count: number;
}

// Socket events
export interface IncomingMessage {
  messageId?: string;
  from: string;
  number: string;
  body: string;
  timestamp: number;
  isGroup: boolean;
  chatName: string;
}

export interface SendMessageData {
  number: string;
  message: string;
}

export interface MessageSentResponse {
  success: boolean;
  to: string;
  message: string;
  messageId: string;
}

// Statistics
export interface Statistics {
  totalMessages: number;
  totalChats: number;
  incomingCount: number;
  outgoingCount: number;
  whatsappConnected: boolean;
}

// User Management
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UsersFilters {
  search: string | null;
  role: string | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface UsersResponse {
  users: UserWithRole[];
  pagination: PaginationInfo;
  filters: UsersFilters;
}

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: string;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

