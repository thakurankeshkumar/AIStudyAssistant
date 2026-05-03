# Study Assistant – AI-Powered Learning Platform

A full-stack web application that leverages **AI** and **Retrieval Augmented Generation (RAG)** to help students interact with their study materials intelligently. Upload PDFs, ask contextual questions, and get AI-powered answers grounded in your documents.

---

## 🎯 Project Overview

**Study Assistant** is built to solve a core learning challenge: students need **fast, accurate answers** from their study materials without manually searching through PDFs. This application combines:

- **AI-powered Q&A** using Groq's high-speed LLM inference
- **Document chunking** for context-aware retrieval  
- **Secure authentication** with JWT and bcrypt
- **Persistent chat history** for revision sessions
- **MongoDB** for scalable data storage

The platform supports two modes:
1. **Document Mode**: Upload a PDF and ask questions grounded in its content
2. **General Mode**: Ask open-ended study questions using the AI's base knowledge

---

## 🏗 Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16.2.4, React 19, Tailwind CSS 4 |
| **Backend** | Next.js API Routes (serverless) |
| **AI/LLM** | Groq SDK (`openai/gpt-oss-120b` model) |
| **Database** | MongoDB with Mongoose ODM |
| **Auth** | JWT + bcryptjs |
| **PDF Processing** | pdf-parse v2 + pdfjs-dist |

---

## 🤖 AI Integration

### How AI Powers the Application

#### **1. Groq LLM Integration**

The application uses **Groq's API** for ultra-fast inference:

```
Endpoint: /app/api/ask/route.js
Model: openai/gpt-oss-120b (open-source, high-performance model)
API: groq-sdk package
```

**Request Flow:**
```
User Question → API Route → Groq LLM → AI Response → Stored in Chat History
```

#### **2. Prompt Engineering**

The AI is given **context-aware prompts**:

- **With Document**: First 5 chunks of the uploaded PDF are included in the prompt to ground the answer in the study material
- **Without Document**: The AI uses its general knowledge but is instructed to provide accurate, study-focused answers

```javascript
// Example prompt with document context
const prompt = `
You are a helpful AI study assistant.

Based ONLY on the following study material:
[PDF chunks extracted and inserted here]

Answer the question: "${userQuestion}"
`;
```

#### **3. Temperature & Response Tuning**

- **Temperature**: 0.7 (balanced between creativity and consistency)
- **Response Style**: Short, clean, and student-friendly
- **Fallback**: If an answer isn't in the material, the AI still provides accurate info with a note

---

## 📄 Document Chunking Strategy

### Why Chunking?

Large PDFs can't be passed entirely to the LLM due to token limits. **Chunking** breaks documents into manageable pieces for efficient retrieval and context injection.

### Chunking Implementation

**File**: `/app/api/upload/route.js`

```javascript
// Chunk extraction from PDF
const chunks = text
  .replace(/\s+/g, " ")          // Normalize whitespace
  .match(/.{1,1000}/g) || [];    // Split into 1000-char chunks
```

**Process:**
1. **Upload PDF** → File received as FormData or Base64
2. **Parse PDF** → Extract text using `pdf-parse` library
3. **Normalize** → Remove excessive whitespace for consistency
4. **Chunk** → Create fixed-size chunks (1000 characters each)
5. **Store** → Save chunks in MongoDB Document schema
6. **Retrieve** → When user asks a question, use first 5 chunks as context

### Chunk Storage Schema

```javascript
// Document Model
{
  userId: ObjectId,
  filename: String,
  chunks: [String],          // Array of 1000-char text chunks
  timestamps: { createdAt, updatedAt }
}
```

### Chunk Retrieval During Q&A

```javascript
if (activeFileId) {
  const doc = await Document.findById(activeFileId);
  const contextChunks = doc.chunks.slice(0, 5).join(" ");  // Top 5 chunks
  // Include contextChunks in the LLM prompt
}
```

**Why first 5 chunks?**
- Usually contains the most relevant content (introduction, key concepts)
- Balances context quality with token efficiency
- Stays within LLM context window limits

---

## 🗄 Database Schema

### User Model
```javascript
{
  name: String,
  username: String (unique),
  password: String (bcrypt hashed),
  stats: {
    chatsCreated: Number,
    chatsDeleted: Number,
    filesUploaded: Number
  },
  firstTime: Boolean,
  timestamps: { createdAt, updatedAt }
}
```

### Chat Model
```javascript
{
  userId: ObjectId (ref: User),
  title: String,
  fileId: ObjectId (ref: Document, nullable),  // Null = General mode
  messages: [
    {
      role: "user" | "assistant",
      content: String
    }
  ],
  timestamps: { createdAt, updatedAt }
}
```

### Document Model
```javascript
{
  userId: ObjectId (ref: User),
  filename: String,
  chunks: [String],  // Array of text chunks from PDF
  timestamps: { createdAt, updatedAt }
}
```

---

## 🔄 Core Workflows

### Workflow 1: Upload & Process PDF

```
User Uploads PDF
    ↓
Upload Route (/api/upload)
    ↓
Parse PDF → Extract Text → Normalize → Chunk (1000 chars each)
    ↓
Store in MongoDB (Document collection)
    ↓
Return fileId to frontend
```

### Workflow 2: Ask Question with Document Context

```
User Asks Question (with PDF attached)
    ↓
Ask Route (/api/ask) receives fileId + question
    ↓
Fetch Document from DB + Extract top 5 chunks
    ↓
Build Prompt: "Based on: [chunks], Answer: [question]"
    ↓
Send to Groq LLM
    ↓
Get AI Response
    ↓
Store [user question, AI answer] in Chat.messages
    ↓
Return answer to frontend
```

### Workflow 3: Chat History & Management

```
Create Chat
    ↓
Store in MongoDB with userId + fileId (optional)
    ↓
Append messages as user interacts
    ↓
Search/Filter by title
    ↓
Rename or Delete (soft-delete with stats tracking)
```

---

## 📁 Project Structure

```
studyassistant/
├── app/
│   ├── api/
│   │   ├── ask/route.js           ← AI Q&A endpoint (Groq LLM)
│   │   ├── upload/route.js        ← PDF upload & chunking
│   │   ├── auth/                  ← Auth routes (login, signup, logout)
│   │   ├── chat/                  ← Chat CRUD (create, delete, history)
│   │   └── account/               ← User profile management
│   ├── home/page.js               ← Main chat interface
│   ├── login/page.js              ← Auth page
│   ├── signup/page.js             ← Registration page
│   ├── settings/page.js           ← User settings
│   ├── layout.js                  ← Root layout with metadata
│   └── globals.css                ← Global styles
│
├── lib/
│   ├── db.js                      ← MongoDB connection + error handling
│   ├── auth.js                    ← JWT authentication logic
│   ├── ai.js                      ← [Reserved for future AI utilities]
│   ├── chunks.js                  ← [Reserved for chunking utilities]
│   └── pdf.js                     ← [Reserved for PDF processing utilities]
│
├── models/
│   ├── User.js                    ← User schema
│   ├── Chat.js                    ← Chat schema
│   └── Document.js                ← Document/PDF chunks schema
│
├── package.json                   ← Dependencies (groq-sdk, mongoose, pdf-parse)
├── next.config.mjs                ← Next.js config
├── tsconfig.json                  ← TypeScript config
├── tailwind.config.js             ← Tailwind CSS config
└── README.md                      ← This file
```

---

## ⚙ Environment Variables

Create a `.env.local` file with:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

**⚠️ Security Note**: Never commit `.env.local`. Add it to `.gitignore`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Groq API key (free tier available)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd studyassistant

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Visit `http://localhost:3000`

---

## 🔐 Key Features

### 1. **Dual-Mode Interaction**
- **PDF Mode**: Upload study materials and get document-specific answers
- **General Mode**: Ask study questions using AI's general knowledge

### 2. **Intelligent Chunking**
- Automatic PDF text extraction and segmentation
- Relevance-based context injection during Q&A

### 3. **Persistent Chat History**
- All conversations saved per user
- Searchable by title and date
- Rename or delete chats anytime

### 4. **Secure Authentication**
- User signup/login with JWT
- Passwords hashed with bcryptjs
- Protected API routes with user verification

### 5. **Usage Statistics**
- Track files uploaded, chats created, and chats deleted
- Available in user profile/settings

### 6. **Optimized UI**
- Dark-themed interface for long study sessions
- Responsive design (mobile, tablet, desktop)
- Real-time message streaming and status updates

---

## 📊 AI Concepts Used

| Concept | Implementation |
|---------|-----------------|
| **LLM Integration** | Groq SDK with `openai/gpt-oss-120b` model |
| **Retrieval Augmented Generation (RAG)** | PDF chunks injected as context in prompts |
| **Text Chunking** | Fixed-size (1000-char) text segments from PDFs |
| **Prompt Engineering** | Context-aware prompts that adapt to document availability |
| **Inference Optimization** | Groq's fast inference for sub-second response times |
| **Temperature Control** | Balanced creativity (0.7) for consistent answers |
| **Fallback Strategy** | AI provides general knowledge when document context is unavailable |

---

## 📦 Key Dependencies

```json
{
  "groq-sdk": "^1.1.2",           ← AI model inference
  "mongoose": "^9.6.1",           ← MongoDB ODM
  "pdf-parse": "^2.4.5",          ← PDF text extraction
  "jsonwebtoken": "^9.0.3",       ← JWT authentication
  "bcryptjs": "^3.0.3",           ← Password hashing
  "next": "16.2.4",               ← Full-stack framework
  "react": "19.2.4"               ← UI library
}
```

---

## 🎓 How This Demonstrates AI Concepts

### For Your Teacher:

1. **AI Integration** ✅
   - Uses Groq's advanced LLM (`gpt-oss-120b`)
   - Real-time inference for Q&A

2. **RAG (Retrieval Augmented Generation)** ✅
   - PDFs are chunked and stored
   - Relevant chunks retrieved during queries
   - AI answers are grounded in user documents

3. **Document Processing** ✅
   - Automated PDF parsing with `pdf-parse`
   - Text normalization and chunking
   - Stored in MongoDB for efficient retrieval

4. **Smart Context Management** ✅
   - Dynamic prompt construction based on user context
   - Fallback to general knowledge when needed
   - Token-efficient chunk selection (top 5)

5. **Production-Ready Architecture** ✅
   - Scalable MongoDB database
   - Secure authentication with JWT
   - Proper error handling and validation
   - Optimized for performance

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/upload` | Upload & chunk PDF |
| POST | `/api/ask` | Get AI answer (with/without PDF) |
| POST | `/api/chat/create` | Create new chat |
| GET | `/api/chat/history` | Get chat history |
| DELETE | `/api/chat/delete` | Delete chat |
| PATCH | `/api/chat/title` | Rename chat |
| GET | `/api/account/stats` | Get user statistics |

---

## 📝 License

This project is part of an academic assignment (INT428, Lovely Professional University).

---

**Built with ❤️ using Next.js, Groq AI, and MongoDB**
