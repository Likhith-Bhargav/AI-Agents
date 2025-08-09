# Customer Support Chat Application

A full-stack customer support chat application built with Next.js, Django, and Tailwind CSS.

## Features

- Real-time chat interface
- Ticket management system
- User authentication
- Agent management
- Responsive design

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Django REST Framework, PostgreSQL
- **Authentication**: JWT
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- PostgreSQL

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up environment variables (create `.env` files in both frontend and backend directories)

4. Run the development servers:
   ```bash
   # Frontend
   cd frontend
   npm run dev

   # Backend
   cd ../backend
   python manage.py runserver
   ```

## License

MIT
