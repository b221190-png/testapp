# Video Proctoring System for Online Interviews

🎯 **AI-Powered Video Monitoring & Focus Detection System**

## 📋 Overview

This system provides real-time video proctoring capabilities for online interviews, detecting candidate focus, unauthorized items, and generating comprehensive integrity reports.

## 🚀 Features

### Core Functionality
- **Real-time Focus Detection**: Monitors if candidate is looking at screen
- **Object Detection**: Identifies phones, books, notes, and electronic devices
- **Face Detection**: Tracks presence and counts multiple faces
- **Event Logging**: Timestamped logs of all detection events
- **Integrity Scoring**: Automated scoring based on violations

### Bonus Features
- **Eye Closure Detection**: Monitors drowsiness and attention
- **Audio Analysis**: Detects background voices
- **Real-time Alerts**: Live notifications for interviewers
- **Comprehensive Reporting**: PDF/CSV report generation

## 🏗️ Architecture

```
video-proctoring-system/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # AI detection services
│   │   ├── utils/          # Helper functions
│   │   └── styles/         # CSS styles
├── server/                 # Node.js Backend
│   ├── routes/             # API endpoints
│   ├── models/             # Database models
│   ├── services/           # Business logic
│   └── utils/              # Server utilities
├── models/                 # AI/ML Models
└── docs/                   # Documentation
```

## 🛠️ Technology Stack

### Frontend
- **React.js** - User interface
- **TensorFlow.js** - Object detection
- **MediaPipe** - Face and pose detection
- **WebRTC** - Video capture and streaming
- **Chart.js** - Analytics visualization

### Backend
- **Node.js & Express** - Server framework
- **MongoDB** - Database for logs and reports
- **Socket.io** - Real-time communication
- **Multer** - File upload handling
- **PDF-Kit** - Report generation

### AI/ML Libraries
- **@tensorflow/tfjs** - Browser-based ML
- **@mediapipe/face_mesh** - Face detection
- **opencv.js** - Computer vision
- **coco-ssd** - Object detection model

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Modern web browser with camera access

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd video-proctoring-system
```

2. **Install all dependencies**
```bash
npm run install-all
```

3. **Environment Setup**
```bash
# Create .env files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

4. **Start development servers**
```bash
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🎮 Usage

### For Interviewers
1. Navigate to the interview dashboard
2. Create a new interview session
3. Share the candidate link
4. Monitor real-time alerts and events
5. Generate post-interview reports

### For Candidates
1. Join using the provided interview link
2. Allow camera and microphone permissions
3. Complete the system check
4. Begin the monitored interview

## 📊 Detection Capabilities

### Focus Detection
- **Looking Away**: >5 seconds away from screen
- **Face Absence**: >10 seconds without face detection
- **Multiple Faces**: Detection of additional persons
- **Eye Closure**: Prolonged eye closure indicating drowsiness

### Object Detection
- **Mobile Devices**: Phones and tablets
- **Written Materials**: Books, papers, notebooks
- **Electronic Devices**: Laptops, tablets, smartwatches
- **Unauthorized Items**: Custom object training

### Audio Analysis
- **Background Voices**: Detection of additional speakers
- **Noise Levels**: Ambient sound monitoring
- **Voice Patterns**: Candidate voice consistency

## 📈 Reporting System

### Real-time Dashboard
- Live event feed
- Focus percentage meter
- Object detection alerts
- Audio level indicators

### Post-Interview Report
- **Candidate Information**: Name, duration, timestamp
- **Focus Analytics**: Time focused vs. distracted
- **Violation Summary**: Detailed event log
- **Integrity Score**: Calculated rating (0-100)
- **Recommendations**: Interviewer notes and suggestions

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - Interviewer authentication
- `POST /api/auth/register` - Create new account

### Interview Management
- `POST /api/interviews` - Create new interview
- `GET /api/interviews/:id` - Get interview details
- `PUT /api/interviews/:id` - Update interview status

### Event Logging
- `POST /api/events` - Log detection event
- `GET /api/events/:interviewId` - Get interview events
- `GET /api/reports/:interviewId` - Generate report

### Real-time Events
- `focus-lost` - Candidate not looking at screen
- `object-detected` - Unauthorized item found
- `multiple-faces` - Additional person detected
- `audio-violation` - Background voice detected

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
```env
# Server Configuration
PORT=5000
NODE_ENV=production
JWT_SECRET=your-jwt-secret

# Database
MONGODB_URI=mongodb://localhost:27017/proctoring
REDIS_URL=redis://localhost:6379

# AI Services
TENSORFLOW_MODEL_URL=https://model-url
MEDIAPIPE_API_KEY=your-api-key
```

### Docker Deployment
```bash
docker-compose up -d
```

## 🧪 Testing

### Run Tests
```bash
# Frontend tests
cd client && npm test

# Backend tests
cd server && npm test

# E2E tests
npm run test:e2e
```

### Performance Testing
- Camera latency: <100ms
- Detection accuracy: >95%
- Real-time processing: 30fps
- Memory usage: <500MB

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support or questions:
- Create an issue on GitHub
- Email: support@videoproctoring.com
- Documentation: [docs/](docs/)

## 🔄 Changelog

### v1.0.0 (Current)
- Initial release with core proctoring features
- Real-time detection and reporting
- Web-based interface with responsive design
- MongoDB integration for data persistence

---

**Built with ❤️ for secure and fair online interviews**
