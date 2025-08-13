# SyncTracker 🌙✨

**AI-Powered Hormonal Cycle-Aware Task Organization for Women**

SyncTracker is an innovative application that helps women optimize their productivity by aligning tasks with their natural hormonal cycles. Using AWS Bedrock and LangChain, it provides intelligent task scheduling that considers energy levels, focus capacity, and cognitive strengths throughout different cycle phases.

## 🌟 Features

### Core Functionality
- **🎤 Voice Input**: Speak naturally about your tasks - the AI understands and categorizes them automatically
- **🤖 Intelligent Agent**: LangChain-powered assistant that understands hormonal cycles and productivity patterns
- **📅 Smart Scheduling**: Automatically schedules tasks at optimal times based on your cycle phase
- **🔄 Calendar Integration**: Syncs with Google Calendar for seamless task management
- **💬 AI Chat Assistant**: Get personalized advice about productivity and cycle management

### Hormonal Cycle Intelligence
- **🌙 Menstrual Phase**: Perfect for reflection, planning, and detail-oriented work
- **🌱 Follicular Phase**: Ideal for creativity, learning, and starting new projects  
- **☀️ Ovulatory Phase**: Peak energy for communication, presentations, and collaboration
- **🍂 Luteal Phase**: Excellent for completing projects and administrative tasks

### Technical Features
- **AWS Bedrock Integration**: Powered by Claude for natural language understanding
- **LangChain Agents**: Sophisticated task analysis and scheduling logic
- **Modern React UI**: Beautiful, responsive interface with cycle-aware design
- **Real-time Voice Processing**: Speech recognition with task categorization
- **Calendar Export**: iCal support for external calendar apps

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- AWS Account with Bedrock access
- Google Calendar API credentials (optional)

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   pip install -r ../requirements.txt
   ```

2. **Environment Configuration**
   ```bash
   cp ../env_example.txt .env
   # Edit .env with your AWS credentials
   ```

3. **Start Backend Server**
   ```bash
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Access Application**
   Open http://localhost:3000 in your browser

## 🏗️ Architecture

### Backend Components
- **FastAPI Server**: RESTful API with comprehensive endpoints
- **Hormonal Cycle Manager**: Core logic for cycle phases and task optimization
- **AWS Bedrock Service**: Natural language processing and task analysis
- **LangChain Agent**: Intelligent task scheduling and recommendations
- **Calendar Service**: Google Calendar integration and iCal export

### Frontend Components
- **React + TypeScript**: Modern, type-safe frontend
- **Tailwind CSS**: Beautiful, responsive design system
- **Framer Motion**: Smooth animations and transitions
- **Voice Interface**: Speech recognition and audio processing
- **Real-time Chat**: Interactive AI assistant

## 📊 Cycle Phases & Optimization

### Menstrual Phase (Days 1-5)
- **Energy**: 3/10 | **Focus**: 6/10
- **Optimal Tasks**: Planning, analysis, reflection, detail work
- **Characteristics**: Introspective, good for organizing and evaluation

### Follicular Phase (Days 6-13)  
- **Energy**: 7/10 | **Focus**: 8/10
- **Optimal Tasks**: Creative work, learning, new projects
- **Characteristics**: Rising energy, peak creativity, problem-solving

### Ovulatory Phase (Days 14-16)
- **Energy**: 9/10 | **Focus**: 7/10  
- **Optimal Tasks**: Presentations, meetings, collaboration
- **Characteristics**: Peak confidence, excellent communication

### Luteal Phase (Days 17-28)
- **Energy**: 5/10 | **Focus**: 9/10
- **Optimal Tasks**: Completing projects, admin work, editing
- **Characteristics**: High attention to detail, analytical thinking

## 🔧 Configuration

### AWS Bedrock Setup
1. Enable Bedrock in your AWS account
2. Request access to Claude models
3. Configure credentials in `.env` file

### Google Calendar Integration (Optional)
1. Create Google Cloud Project
2. Enable Calendar API
3. Download credentials.json
4. Place in project root

## 🎯 Usage Examples

### Voice Input
```
"I need to write a blog post about productivity, 
prepare for my presentation next week, 
and organize my files. The presentation is due Friday."
```

The AI will:
- Categorize tasks by type (creative, communication, administrative)
- Schedule the blog post during your follicular phase (high creativity)
- Schedule presentation prep during ovulatory phase (peak communication)
- Schedule file organization during luteal phase (detail-oriented)

### Chat Assistant
```
User: "I'm feeling low energy today, what should I focus on?"
Assistant: "You're in your menstrual phase where energy is naturally lower 
but focus is high. This is perfect for planning next month's goals, 
reviewing past projects, or doing detailed analytical work..."
```

## 🛠️ Development

### Project Structure
```
SyncTracker/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── models/              # Data models and cycle logic
│   ├── services/            # AWS Bedrock and calendar services  
│   └── agents/              # LangChain agents
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.tsx          # Main application
│   │   └── index.css        # Tailwind styles
│   └── package.json
└── requirements.txt         # Python dependencies
```

### API Endpoints

#### Cycle Management
- `POST /api/cycle/setup` - Set up user cycle data
- `GET /api/cycle/{user_id}/current` - Get current phase
- `GET /api/cycle/{user_id}/insights` - Get daily insights

#### Task Management
- `POST /api/tasks/analyze` - Analyze task text
- `POST /api/tasks/voice` - Process voice input
- `POST /api/tasks/schedule` - Schedule task optimally

#### AI Assistant
- `POST /api/chat` - Chat with cycle-aware agent

## 🎨 Design System

The UI uses a cycle-aware color system:
- **Menstrual**: Red tones for introspection
- **Follicular**: Green tones for growth  
- **Ovulatory**: Yellow/orange for energy
- **Luteal**: Blue tones for focus

## 🔒 Privacy & Security

- All cycle data is stored securely
- No personal health information is shared with external services
- AWS Bedrock processes requests without storing personal data
- Optional Google Calendar integration requires explicit user consent

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and code of conduct.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- AWS Bedrock team for AI capabilities
- LangChain community for agent frameworks
- React and Tailwind CSS teams for excellent developer tools
- All the women who provided feedback on cycle-aware productivity

## 📞 Support

For questions, issues, or feedback:
- Open a GitHub issue
- Join our community discussions
- Check the FAQ in our documentation

---

**SyncTracker**: *Because your productivity should work with your body, not against it.* 🌙✨