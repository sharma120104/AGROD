# AGROD - Agricultural Growth and Remote Observation Drone

AGROD is a web-based application for farmers to detect plant diseases in cotton and coconut crops with an interactive drone spraying simulation.

## Features

- Disease detection for cotton and coconut crops
- Treatment recommendations
- Interactive drone simulation for pesticide application
- Maturity analysis for coconut crops

## Setup Instructions (Outside Replit)

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Installation Steps

1. Clone the repository
```
git clone <repository-url>
cd agrod
```

2. Create a virtual environment (recommended)
```
python -m venv venv
```

3. Activate the virtual environment
   - Windows:
   ```
   venv\Scripts\activate
   ```
   - macOS/Linux:
   ```
   source venv/bin/activate
   ```

4. Install dependencies
```
pip install -r app_requirements.txt
```

5. Set up environment variables
Create a `.env` file in the root directory with the following variables:
```
# For development, you can use SQLite
DATABASE_URL=sqlite:///agrod.db
# For production, use PostgreSQL
# DATABASE_URL=postgresql://username:password@localhost/agrod
SESSION_SECRET=your_secret_key_here
```

6. Run the application
```
# For development
flask run

# For production
gunicorn "main:app" --bind 0.0.0.0:5000
```

7. Access the application at `http://localhost:5000`

## Database Setup

The application uses SQLAlchemy and can work with SQLite (development) or PostgreSQL (production).
When you first run the application with a new database, the tables will be created automatically and
sample disease data will be loaded.

## License

Copyright © 2025 AGROD. All rights reserved.