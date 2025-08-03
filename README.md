# Minifigures Collection Manager

## Table of Contents

- [Project Overview](#project-overview)
- [Environment Requirements](#environment-requirements)
- [Project Structure](#project-structure)
- [Setup and Running](#setup-and-running)
  - [Automated launch (recommended)](#automated-launch-recommended)
  - [Manual launch](#manual-launch)
- [Access](#access)
- [Notes](#notes)
- [Contact](#contact)

## Project Overview

This project is a full-stack application for managing LEGO minifigures collections. It includes:

- **Backend:** A Flask API to serve and manage minifigure data, including price history and quantities.
- **Frontend:** An Angular application that displays minifigure data and allows interaction with the collection.

The backend handles data and business logic, while the frontend provides a user-friendly interface.

---

## Environment Requirements

- **Python 3.8+** (backend)  
- **Node.js 18+** and **npm 8+** (frontend)  
- Unix-like OS (Linux/macOS) recommended for running the provided scripts  

---

## Project Structure

```perl
root/
├── backend/ # Flask backend source code
│ ├── app.py # Main backend API application
│ ├── requirements.txt # Python dependencies
│ └── venv/ # Python virtual environment (auto-created)
├── frontend/ # Angular frontend application
│ ├── src/ # Angular source files
│ ├── package.json # Node/npm dependencies
│ ├── package-lock.json # Lockfile for npm
│ └── node_modules/ # Installed npm packages
├── start_project.sh # Script to setup and launch backend + frontend
└── README.md # This file
```

---

## Setup and Running

### Automated launch (recommended)

Run the shell script to setup and start both backend and frontend:

```bash
chmod +x start_project.sh
./start_project.sh
````
This script will:

- Create a Python virtual environment in ```backend/venv``` if not present

- Install backend dependencies (```requirements.txt```)

- Install frontend dependencies (```npm install```) if needed

- Start the Flask backend server in the background

- Start the Angular frontend server

Press ```CTRL+C``` to stop the frontend; the backend process will be terminated automatically.


### Manual launch

**Backend:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
flask run
```

**Frontend:**

```bash
cd frontend
npm install
npm start
```

## Access
Open your browser at: http://localhost:4200

The frontend communicates with the backend API at http://127.0.0.1:5000.


## Notes

- Ensure ports 4200 (frontend) and 5000 (backend) are available.

- Use npm install or pip install after any dependency updates.

- The start_project.sh script handles process cleanup on exit.

- The backend data files are stored locally (JSON).



## Contact

Feel free to open issues or submit pull requests for improvements!