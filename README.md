# VitasMMA – AI MMA & Workout Coach

AI-powered MMA and combat sports strength-and-conditioning coach delivering personalised periodized training plans, technical drill cues, and fight-camp programming.

<p align="left">
  <a href="https://vitasmma.com"><img src="https://img.shields.io/badge/Web_App-vitasmma.com-red?style=flat-square" alt="Web App" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-green?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20Android-blue?style=flat-square" alt="Platform" />
</p>

---

## 🥊 Problem

MMA athletes, combat sport practitioners, and functional gym-goers face unique training challenges:

- **Generic Training Plans:** Traditional fitness apps focus on bodybuilding or basic cardio, completely ignoring combat sport demands (energy systems, neck/wrist durability, rotational power).
- **Access to Elite Coaching:** High-level fight camp coaching and individualized periodization are often cost-prohibitive.
- **Fatigue & Injury Imbalance:** Juggling striking, grappling, wrestling, and heavy strength training often leads to overtraining and injuries without adaptive volume regulation.

---

## ⚡ Solution

VitasMMA integrates sports science and AI coaching agents:

- **Intelligent Periodization:** Dynamically plans microcycles and mesocycles across fight camp phases (Base conditioning, Peak strength, Taper, Recovery).
- **Discipline-Specific Drills:** Tailored routines spanning Muay Thai, Boxing, Brazilian Jiu-Jitsu (Gi/No-Gi), and Wrestling.
- **Real-Time Technical Cues:** AI coach chat provides biomechanical reminders, sparring strategy, and weight-cut guidance.
- **Adaptive Volume Scaling:** Regulates training volume based on athlete recovery, soreness, and upcoming fight/competition dates.

---

## ✨ Key Features

- **Personalised Strength & Conditioning:** Periodized routines built around functional power, rotational core, and anaerobic capacity.
- **Fight Camp Programmer:** 4, 8, and 12-week fight camp preparation templates with automated tapering.
- **AI Coach Assistant:** 24/7 technical Q&A covering fight IQ, sparring analysis, and mobility drills.
- **Cross-Platform Architecture:** Built with React & TypeScript, with Capacitor configuration for Android deployment.

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Mobile Packaging:** Capacitor, Android Studio
- **Backend:** Node.js, Express, Firebase Firestore
- **AI Engine:** LLM-based coaching agents with domain-specific prompting and fight-camp heuristics

---

## 🚀 Quick Start (Run Locally)

### 1. Clone Repository
```bash
git clone https://github.com/LuminaraDigital/VitasMMA.git
cd VitasMMA
```

### 2. Configure Environment
```bash
cp .env.example .env
# Set your AI API keys and Firebase credentials
```

### 3. Install & Run
```bash
npm install
npm run dev
```

---

## 📄 License

Distributed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See [LICENSE](LICENSE) for details.