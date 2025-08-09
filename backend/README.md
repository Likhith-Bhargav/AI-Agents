# Customer Support Chat - Backend

This is the Django REST Framework backend for the Customer Support Chat application.

## Prerequisites

- Python 3.13+
- pip (Python package manager)

## Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd customer-support-chat/backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   Create a `.env` file in the `backend` directory with the following variables:
   ```
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   ```

5. **Run migrations**:
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser (admin)**:
   ```bash
   python manage.py createsuperuser_custom
   ```
   Follow the prompts to create an admin user.

## Running the Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/`

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: `http://localhost:8000/swagger/`
- ReDoc: `http://localhost:8000/redoc/`

## API Endpoints

### Authentication

- `POST /api/auth/register/` - Register a new user
- `POST /api/auth/token/` - Obtain JWT token (login)
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `POST /api/auth/token/verify/` - Verify JWT token
- `POST /api/auth/change-password/` - Change password
- `GET /api/auth/check-auth/` - Check authentication status

### Agents

- `GET /api/agents/` - List all agents
- `POST /api/agents/` - Create a new agent
- `GET /api/agents/{id}/` - Retrieve an agent
- `PUT /api/agents/{id}/` - Update an agent
- `PATCH /api/agents/{id}/` - Partially update an agent
- `DELETE /api/agents/{id}/` - Delete an agent
- `POST /api/agents/{id}/toggle_status/` - Toggle agent's active status

### Tickets

- `GET /api/tickets/` - List all tickets
- `POST /api/tickets/` - Create a new ticket
- `GET /api/tickets/{id}/` - Retrieve a ticket
- `PUT /api/tickets/{id}/` - Update a ticket
- `PATCH /api/tickets/{id}/` - Partially update a ticket
- `DELETE /api/tickets/{id}/` - Delete a ticket
- `POST /api/tickets/{id}/update_status/` - Update ticket status
- `POST /api/tickets/{id}/assign_agent/` - Assign an agent to a ticket

## Testing

To run the test suite:

```bash
python manage.py test
```

## Production Deployment

For production deployment, make sure to:

1. Set `DEBUG=False` in your environment variables
2. Set a strong `SECRET_KEY`
3. Configure a production database (PostgreSQL recommended)
4. Set up a proper WSGI server (Gunicorn, uWSGI)
5. Set up a web server (Nginx, Apache)
6. Set up proper SSL/TLS certificates (Let's Encrypt recommended)

## License

[Your License Here]
