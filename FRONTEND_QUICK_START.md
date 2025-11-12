# Frontend Quick Start Guide

Panduan cepat untuk setup frontend React TypeScript + shadcn/ui.

## 🚀 Quick Setup (5 Menit)

### 1. Install Dependencies

```bash
# Core dependencies
npm install socket.io-client axios react-router-dom date-fns lucide-react

# Types
npm install -D @types/socket.io-client @types/react-router-dom

# shadcn/ui components
npx shadcn-ui@latest add button card input label textarea alert badge scroll-area
```

### 2. Environment Setup

Buat `.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### 3. File Structure

```
src/
├── lib/
│   ├── types.ts          # Copy dari FRONTEND_INTEGRATION.md
│   ├── api.ts            # Copy dari FRONTEND_INTEGRATION.md
│   └── socket.ts         # Copy dari FRONTEND_INTEGRATION.md
├── context/
│   └── AuthContext.tsx   # Copy dari FRONTEND_INTEGRATION.md
├── hooks/
│   ├── useWhatsApp.ts    # Copy dari FRONTEND_INTEGRATION.md
│   └── useMessages.ts    # Copy dari FRONTEND_INTEGRATION.md
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx
│   └── whatsapp/
│       ├── QRCodeDisplay.tsx
│       ├── ChatList.tsx
│       ├── MessageList.tsx
│       ├── SendMessageForm.tsx
│       └── Statistics.tsx
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   └── Dashboard.tsx
├── App.tsx
└── main.tsx
```

## 📋 Implementation Checklist

- [ ] Install dependencies
- [ ] Setup environment variables
- [ ] Copy `lib/types.ts`
- [ ] Copy `lib/api.ts`
- [ ] Copy `lib/socket.ts`
- [ ] Copy `context/AuthContext.tsx`
- [ ] Copy `hooks/useWhatsApp.ts`
- [ ] Copy `hooks/useMessages.ts`
- [ ] Copy all components
- [ ] Copy all pages
- [ ] Setup `App.tsx` with routes
- [ ] Test login/register
- [ ] Test WhatsApp connection
- [ ] Test send/receive messages

## 🔑 Key Concepts

### 1. Authentication Flow

```typescript
// Login
const { login } = useAuth();
await login({ email, password });
// Token disimpan di localStorage
// Socket.IO auto-connect dengan token
```

### 2. Socket.IO Connection

```typescript
// Auto-connect saat login
socketClient.connect(token);

// Listen events
socketClient.on('qr', (qr) => setQrCode(qr));
socketClient.on('ready', () => setIsReady(true));
socketClient.on('message', (msg) => handleMessage(msg));
```

### 3. Send Message

```typescript
// Via Socket.IO
socketClient.sendMessage({ 
  number: '628123456789', 
  message: 'Hello' 
});

// Auto-saved to database by backend
```

### 4. Get Messages

```typescript
// From API (with pagination)
const data = await api.getMessageHistory(chatId, 50);

// Real-time updates via Socket.IO
socketClient.on('message', (msg) => {
  // Add to messages list
});
```

## 🎯 Minimal Implementation

Jika ingin implementasi minimal, fokus pada:

### 1. Core Files (WAJIB)

```
lib/types.ts       ← Type definitions
lib/api.ts         ← API client
lib/socket.ts      ← Socket.IO client
context/AuthContext.tsx  ← Authentication
```

### 2. Essential Components

```
LoginForm.tsx      ← Login UI
QRCodeDisplay.tsx  ← Show QR code
SendMessageForm.tsx ← Send message
```

### 3. Main Page

```
Dashboard.tsx      ← Main interface
```

## 🧪 Testing Steps

### 1. Backend Running

```bash
cd backend
npm start
# Server di http://localhost:3000
```

### 2. Frontend Running

```bash
cd frontend
npm run dev
# Frontend di http://localhost:5173
```

### 3. Test Flow

1. **Register**: Buka `/register` → Register user baru
2. **Login**: Login dengan credentials
3. **QR Code**: Scan QR code yang muncul
4. **Connected**: Tunggu status "Connected"
5. **Send Message**: Test send message
6. **Receive**: Test receive message dari WhatsApp mobile

## 🐛 Common Issues

### Issue 1: CORS Error

**Error**: `Access to XMLHttpRequest has been blocked by CORS`

**Solution**: Backend sudah setup CORS. Pastikan `VITE_API_URL` benar.

### Issue 2: Socket Not Connecting

**Error**: Socket connection failed

**Solution**:
- Check token valid (login ulang)
- Check backend running
- Check `VITE_SOCKET_URL` benar

### Issue 3: QR Code Not Showing

**Error**: QR code tidak muncul

**Solution**:
- Check socket connected
- Check console logs untuk error
- Tunggu beberapa detik (initialization)

## 📝 Code Snippets

### Quick Login Test

```typescript
// Test login via console
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
});
const data = await response.json();
console.log('Token:', data.token);
```

### Quick Socket Test

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_TOKEN' }
});

socket.on('qr', (qr) => console.log('QR:', qr));
socket.on('ready', () => console.log('Ready!'));
socket.on('message', (msg) => console.log('Message:', msg));
```

## 🎨 UI Customization

### Theme

shadcn/ui menggunakan CSS variables. Edit `globals.css`:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... customize colors */
}
```

### Components

Semua shadcn components bisa di-customize di `components/ui/`.

## 📚 Documentation Links

- **Full Integration**: `FRONTEND_INTEGRATION.md`
- **Components Part 2**: `FRONTEND_INTEGRATION_PART2.md`
- **Backend API**: `README.md`
- **Setup Guide**: `SETUP_GUIDE.md`

## ✅ Checklist Sebelum Production

- [ ] Ganti `VITE_API_URL` ke production URL
- [ ] Ganti `VITE_SOCKET_URL` ke production URL
- [ ] Setup HTTPS
- [ ] Add error boundaries
- [ ] Add loading states
- [ ] Add toast notifications
- [ ] Add form validation
- [ ] Test di mobile
- [ ] Optimize bundle size
- [ ] Add analytics

## 🚀 Next Steps

1. ✅ Setup basic frontend
2. 🔄 Test authentication
3. 🔄 Test WhatsApp connection
4. 🔄 Test messaging
5. 🔄 Add advanced features:
   - Message search
   - File upload
   - Group management
   - Contact management
   - Export chat history

Happy coding! 🎉
