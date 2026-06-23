<div align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/React-Light.svg" width="60" alt="React Logo" />
  <h1>✨ LunaCare ✨</h1>
  <p><strong>Cinematic Body Intelligence & Premium Cycle Tracking</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Framer_Motion-11.x-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
    <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  </p>
</div>

<br />

> **LunaCare** is a next-generation period and cycle health tracking platform. Inspired by the premium aesthetics of *Apple Health*, *Oura*, and *Flo Premium*, it moves away from generic healthcare dashboards to deliver an emotionally resonant, living body-intelligence engine.

## 🌌 The Vision

Health data shouldn't feel like a spreadsheet. It should feel like a sanctuary. LunaCare was built with **luxury minimalism** and **ambient glassmorphism** in mind. The experience feels elegant, intelligent, modern, and deeply personal.

## ✨ Key Features

- **The Prediction Core (WebGL Orb)**: A stunning, central, pulsing intelligence orb that analyzes body rhythms in real time. It reacts to your scroll, your interactions, and your cycle phases.
- **Cinematic Onboarding**: An 8-step beautifully animated wizard capturing health data without the friction of traditional forms.
- **Ambient Authentication**: A visually pleasing Auth Flow (Sign In, Sign Up, Forgot Password) complete with a glass-card layout, ambient background shaders, and seamless transitions.
- **Living Rhythm Navigation**: An intelligent routing system gracefully shifting you from our beautiful Landing Page right into your active Dashboard.

## 🎨 Design Language

Our visual identity is built on carefully curated tokens and styles to bring a premium wellness aesthetic:
- **Colors**: Soft Pink, Lavender, Rose, and Ambient Glows.
- **Typography**: Modern, geometric typography for high legibility and a luxury feel.
- **Effects**: Heavy use of glassmorphism (`backdrop-blur`), soft shadows, subtle micro-animations, and fluid transitions.

## 🛠 Tech Stack & Architecture

- **Frontend Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/) (Extremely fast HMR)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a highly customized `tailwind.config.js` design system.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & Custom Canvas implementations.
- **Routing**: `react-router-dom` for seamless SPA transitions.
- **State Management**: Centralized React Context (`AppContext.tsx`).

## ⚡ Real-Time Backend Integration

To make this frontend fully functional in real-time, setup the Neon database, Prisma models, and Socket.io gateway:
👉 **[Read the Backend Setup Guide (BACKEND_SETUP.md)](file:///c:/Users/sy753/Patternprinting.c/OneDrive/Documents/WEB%20Development/periods%20health%20tracker/BACKEND_SETUP.md)**

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites
Make sure you have Node.js and npm installed.

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/MVPAlok/Menstrual-Health-Tracker.git
   ```
2. Navigate to the directory:
   ```sh
   cd "periods health tracker"
   ```
3. Install dependencies:
   ```sh
   npm install
   ```
4. Start the development server:
   ```sh
   npm run dev
   ```
5. Open your browser and visit: `http://localhost:5173`

## 📂 Project Structure

```text
src/
├── components/          # Reusable UI elements, Orbs, and Flows
│   ├── AuthFlow.tsx     # Sign In, Sign Up, Success
│   ├── Dashboard.tsx    # Main App Dashboard with WebGL Orb
│   ├── OnboardingFlow.tsx# 8-Step Initial Setup
│   └── BackgroundShader.tsx # Ambient Background Canvas
├── context/
│   └── AppContext.tsx   # Global State Management
├── LandingPage.tsx      # Cinematic Product Marketing Page
├── App.tsx              # App Routing Configuration
├── index.css            # Global Styles & Tailwind Directives
└── main.tsx             # React Entry Point
```

<br />

<div align="center">
  <p>Built with ❤️ for a better understanding of body intelligence.</p>
</div>
