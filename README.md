# TaskFlow — Focus & Productivity

A modern, responsive task management web application built with vanilla JavaScript, modern CSS, and Google Cloud Firestore for real-time data persistence.

## Live Demo
- **Live Site**: https://subtle-mandazi-f387ee.netlify.app
- **GitHub Repository**: https://github.com/HONORINEIRADUKUNDA/taskflow-app

## Features
- **Real-Time Data Persistence**: Synchronized across devices and tabs using Firebase Cloud Firestore (`onSnapshot`).
- **Complete CRUD Operations**: Create tasks, mark them complete/active, perform inline title editing, and delete items.
- **Filtering & Dynamic Counter**: Filter tasks seamlessly by All, Active, and Completed, with an auto-updating counter for remaining tasks.
- **Mobile-First Responsive Design**: Optimized typography, spacing, and controls adapting fluidly from mobile (down to 360px) to desktop.
- **Accessibility & Security**: Screen-reader friendly semantic markup, ARIA live regions, and XSS sanitization on user inputs.

## Tech Stack
- **Frontend**: Semantic HTML5, Modern CSS3 (CSS Variables, Flexbox), Vanilla JavaScript (ES Modules)
- **Backend / Database**: Google Cloud Firestore (Modular SDK v10)
- **Hosting**: Netlify

## Firestore Data Schema
Collections: `tasks`
```json
{
  "id": "auto-generated-doc-id",
  "title": "Task description string",
  "isCompleted": false,
  "createdAt": "serverTimestamp"
}