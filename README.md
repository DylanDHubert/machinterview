# Mach Interview

Mach Interview is an AI-powered interview preparation and simulation platform that helps job seekers practice technical interviews with an AI assistant. The application analyzes resumes, processes job descriptions, and generates personalized interview questions based on your background and target position.

![Mach Interview](https://github.com/DylanDHubert/machinterview/raw/main/public/demo-screenshot.png)

## Architecture Overview

The application is built as a modern web application with a Next.js frontend and serverless backend architecture:

```
├── Frontend (Next.js)
│   ├── Main UI Components
│   │   ├── Document Upload (Resume)
│   │   ├── Job Description Form
│   │   ├── Real-time AI Interaction
│   │   └── Audio/Visual Indicators
│   └── Custom Hooks
│       └── WebRTC Audio Session Management
│
├── Backend (Next.js API Routes)
│   ├── /api/upload-pdf
│   └── /api/check-run
│
└── AI Integration
    ├── OpenAI Assistants API (Resume Analysis)
    └── OpenAI WebRTC Realtime API (Interview Simulation)
```

## Key Features

- **Resume Analysis**: Upload and extract key information from your PDF resume using OpenAI's document understanding capabilities
- **Job Description Processing**: Input job details to tailor the interview experience to specific positions
- **Real-time AI Interview**: Conduct a natural interview conversation with AI using WebRTC audio streaming
- **Dynamic Context Integration**: The AI assistant adapts questions based on your resume and target job
- **Visual Indicators**: Real-time feedback showing when the AI is speaking or listening
- **Responsive Interface**: Clean, modern UI with visual states for all process stages

## Technology Stack

- **Frontend**:
  - Next.js 15 (React framework)
  - Tailwind CSS (styling with dark mode support)
  - Framer Motion (animations and transitions)
  - shadcn/ui (component library)
  - TypeScript (type safety)

- **Backend**:
  - Next.js API Routes (serverless functions)
  - OpenAI SDK integration

- **AI Components**:
  - OpenAI Assistants API for resume parsing
  - OpenAI WebRTC for real-time audio conversation
  - Document analysis with GPT-4 Turbo

- **Data Flow**:
  - WebRTC audio streaming
  - PDF document processing
  - Real-time state management

## API Endpoints

### `/api/upload-pdf`

Handles resume uploads and processing:

```typescript
POST /api/upload-pdf
Content-Type: multipart/form-data

// Request Body:
file: [PDF File]

// Response:
{
  "success": true,
  "threadId": "thread_abc123...",
  "runId": "run_xyz789..."
}
```

### `/api/check-run`

Checks the status of OpenAI processing:

```typescript
GET /api/check-run?threadId={threadId}&runId={runId}

// Response (in-progress):
{
  "success": true,
  "done": false,
  "status": "in_progress"
}

// Response (completed):
{
  "success": true,
  "done": true,
  "raw": "...",
  "parsed": {
    "fullName": "...",
    "email": "...",
    "skills": [...],
    ...
  }
}
```

## Core Components

### Document Upload

Handles resume upload with:
- Drag-and-drop interface
- PDF validation
- Processing status indicators
- Resume data display

### Job Description

Manages job information with:
- Form for company name, position, and description
- Edit/save functionality
- Structured job data storage

### AI Speech Indicator

Provides visual feedback on the AI's state:
- Visual indicators for when AI is listening/speaking
- Animation effects for audio activity
- Status text reflecting current interaction state

### Broadcast Button

Controls the interview session:
- Start/stop broadcasting functionality
- Visual state changes based on session activity
- Integration with WebRTC audio session

## WebRTC Implementation

A custom React hook (`useWebRTCAudioSession`) handles:
- Real-time audio streaming with OpenAI
- Session management (start/stop)
- Audio visualization and volume detection
- Message handling and conversation state

## Setup and Development

### Prerequisites

- Node.js 18+ or Deno
- OpenAI API Key with access to:
  - Assistants API
  - Realtime API (Beta)

### Environment Variables

```
OPENAI_API_KEY=your-openai-api-key
```

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Production

The application is optimized for deployment on Vercel with:
- Edge function support
- Automatic HTTPS
- Serverless API routes

## Created By

Dylan Hubert & Luke Heitman

## License

MIT License
