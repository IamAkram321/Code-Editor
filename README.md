# 🚀 Advanced Real-Time Collaborative Code Editor

A feature-rich, real-time collaborative code editor where multiple users can write, edit, and share code simultaneously. Built with **React, Node.js, and WebSockets** to enable seamless collaboration with professional-grade features.

---

## ✨ Key Features

### 🎯 Core Collaboration
- 🔗 **Real-time code synchronization** across multiple clients
- 👥 **Multi-user collaboration** - See who's in the room
- ⚡ **WebSocket-based** instant updates
- 📍 **Cursor tracking** - See where other users are typing

### 💻 Code Editor Features
- 🌐 **Programming Language** - JavaScript
- 🎨 **6 Beautiful Themes** - Dracula, Monokai, Material, Nord, Solarized, Tomorrow Night
- 🔍 **Search & Replace** - Find and replace text with keyboard shortcuts (Ctrl+F, Ctrl+H)
- 💅 **Code Formatting** - Auto-format JavaScript, HTML, and CSS code
- 📝 **Syntax Highlighting** - Full syntax support for all languages
- 📋 **Copy Code** - One-click copy to clipboard
- 💾 **Download Code** - Export your code with proper file extensions

### 🚀 Advanced Features
- ▶️ **Live Code Execution** - Run JavaScript code directly in the browser
- 💬 **Real-time Chat** - Communicate with team members while coding
- 📁 **File Management** - Multiple files per room with easy switching
- 🎛️ **Language & Theme Sync** - Changes sync across all users in real-time
- ⌨️ **Keyboard Shortcuts** - Power user features (Ctrl+F, Ctrl+S, Ctrl+/, etc.)

### 🎨 User Experience
- 🎯 **Modern UI** - Clean, intuitive interface built with Tailwind CSS
- 📱 **Responsive Design** - Works on different screen sizes
- 🔔 **Toast Notifications** - Real-time feedback for all actions
- 👤 **User Avatars** - Visual representation of connected users

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Communication:** Socket.IO (WebSockets)
- **Editor:** CodeMirror 5
- **Code Formatting:** js-beautify
- **Other Tools:** ESLint, React Router, React Hot Toast

---

## 📸 Screenshots

### Homepage
![Homepage](./screenshots/codesyncs.png)

### Editor Page
![Editor](./screenshots/codesyncss.png)

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js >= 18.x
- npm or yarn

### Installation Steps

```bash
# Clone the repository
git clone https://github.com/iamakram321/code-editor.git

# Navigate to project folder
cd code-editor

# Install dependencies
npm install

# Set up environment variable (optional)
# Create a .env file in the root directory
# VITE_SERVER_URL=http://localhost:5000
```

### Running the Application

```bash
# Start the server (in one terminal)
npm run server:dev
# or for production
npm start

# Start the frontend development server (in another terminal)
npm run dev

# The app will be available at http://localhost:5173
# The server runs on http://localhost:5000
```

### Building for Production

```bash
# Build the frontend
npm run build

# Start production server
npm start
```

---

## 🚀 How It Works

1. **Create or Join a Room**
   - Create a new room or join using a room ID
   - Enter your username

2. **Start Coding**
   - Choose your programming language
   - Select a theme
   - Start coding with real-time sync

3. **Collaborate**
   - Multiple users can edit simultaneously
   - See connected users in the sidebar
   - Use chat to communicate
   - Run code and see output

4. **Advanced Features**
   - Add multiple files to your project
   - Use search & replace (Ctrl+F)
   - Format your code
   - Download your code

---

## ⌨️ Keyboard Shortcuts

- `Ctrl+F` / `Ctrl+H` - Open search/replace dialog
- `Ctrl+S` - Download code
- `Ctrl+/` - Toggle comment
- `Shift+Tab` - Unindent selection

---

## 🎯 Supported Languages

- JavaScript / JSX
- Python
- Java
- C / C++
- TypeScript
- HTML / CSS
- PHP
- Ruby
- Go
- Rust
- SQL
- Markdown
- YAML
- JSON

---

## 🎨 Available Themes

- Dracula
- Monokai
- Material
- Nord
- Solarized Dark
- Tomorrow Night Bright

---

## 🔮 Future Enhancements

- [ ] User authentication & profiles
- [ ] Code history / version control
- [ ] Video/audio chat integration
- [ ] Backend code execution (Python, Java, etc.)
- [ ] Code sharing via URL
- [ ] Read-only mode for viewers
- [ ] User permissions (admin/viewer)
- [ ] Export to GitHub
- [ ] AI code suggestions
- [ ] Collaborative debugging

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork the repo and submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the MIT License.

---

## 👨‍💻 Author

Built with ❤️ by [IamAkram](https://github.com/IamAkram321)

---

## 🙏 Acknowledgments

- CodeMirror for the amazing editor
- Socket.IO for real-time communication
- React team for the fantastic framework
- All contributors and users of this project
