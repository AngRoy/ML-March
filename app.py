import streamlit as st
import sqlite3
import pandas as pd
import json
from datetime import datetime
import uuid
import hashlib
from streamlit.web.server.websocket_headers import _get_websocket_headers

# Configure page
st.set_page_config(
    page_title="ML March API Service",
    page_icon="🤖",
    layout="wide"
)

# Initialize database
def init_db():
    conn = sqlite3.connect('mlmarch.db')
    c = conn.cursor()
    
    # Create users table
    c.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        institution TEXT,
        education_level TEXT,
        ml_experience TEXT,
        interests TEXT,
        bio TEXT,
        created_at TEXT,
        updated_at TEXT
    )
    ''')
    
    # Create sessions table
    c.execute('''
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        status TEXT
    )
    ''')
    
    # Create user_sessions table (for tracking registrations and attendance)
    c.execute('''
    CREATE TABLE IF NOT EXISTS user_sessions (
        user_id TEXT,
        session_id TEXT,
        registered_at TEXT,
        attended BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (session_id) REFERENCES sessions (id),
        PRIMARY KEY (user_id, session_id)
    )
    ''')
    
    # Insert sample sessions if none exist
    c.execute('SELECT COUNT(*) FROM sessions')
    if c.fetchone()[0] == 0:
        sessions = [
            ("s1", "Introduction to Data Science and Statistical Methods for ML", "A foundational overview of key statistical methods and data science principles essential for machine learning.", "2025-03-10", "10:00 AM - 12:00 PM", "upcoming"),
            ("s2", "Introduction to Machine Learning", "Explore core ML concepts, algorithms, and implementation techniques.", "2025-03-12", "2:00 PM - 4:00 PM", "upcoming"),
            ("s3", "Implementation of Machine Learning Models and Applications", "Hands-on session on implementing various ML models and exploring real-world applications.", "2025-03-18", "10:00 AM - 1:00 PM", "upcoming"),
            ("s4", "Introduction to Artificial Neural Networks", "Deep dive into neural network architectures, training methodologies, and applications.", "2025-03-20", "2:00 PM - 5:00 PM", "upcoming"),
            ("s5", "Introduction to Natural Language Processing", "Learn how machines understand, interpret, and generate human language.", "2025-03-24", "10:00 AM - 12:00 PM", "upcoming"),
            ("s6", "Computer Vision", "Discover techniques for image analysis, object detection, and visual recognition systems.", "2025-03-26", "2:00 PM - 5:00 PM", "upcoming"),
            ("s7", "Robotics & MLOps", "Explore the integration of ML techniques in robotics and autonomous systems, followed by best practices for deploying, managing, and scaling machine learning models in production.", "2025-03-28", "10:00 AM - 1:00 PM", "upcoming")
        ]
        c.executemany('INSERT INTO sessions VALUES (?, ?, ?, ?, ?, ?)', sessions)
    
    conn.commit()
    conn.close()

# Initialize database on app start
init_db()

# Display API docs in the UI
def show_api_docs():
    st.title("ML March API Service")
    st.markdown("""
    This Streamlit app serves as a backend API for the ML March website. It provides endpoints to manage users and session data.
    
    ## Available Endpoints:
    
    ### Users
    - `GET /api/users` - Get all users
    - `GET /api/users/{email}` - Get user by email
    - `POST /api/users` - Create or update a user
    
    ### Sessions
    - `GET /api/sessions` - Get all sessions
    - `GET /api/sessions/{id}` - Get session by ID
    - `GET /api/user-sessions/{email}` - Get sessions registered by a user
    
    ### Registration
    - `POST /api/register` - Register a user for a session
    - `DELETE /api/register` - Unregister a user from a session
    
    To use this API from your frontend, make requests to this Streamlit app's URL.
    """)

# Function to extract request parameters
def get_query_params():
    query_params = st.experimental_get_query_params()
    return query_params

# API endpoints
def handle_request():
    # Get the path from query parameters
    params = get_query_params()
    path = params.get('path', [''])[0]
    method = params.get('method', ['GET'])[0]
    
    if not path.startswith('/api/'):
        show_api_docs()
        return
        
    # Process API requests
    if path == '/api/users' and method == 'GET':
        get_all_users()
    elif path.startswith('/api/users/') and method == 'GET':
        email = path.split('/api/users/')[1]
        get_user_by_email(email)
    elif path == '/api/users' and method == 'POST':
        create_or_update_user()
    elif path == '/api/sessions' and method == 'GET':
        get_all_sessions()
    elif path.startswith('/api/sessions/') and method == 'GET':
        session_id = path.split('/api/sessions/')[1]
        get_session_by_id(session_id)
    elif path.startswith('/api/user-sessions/') and method == 'GET':
        email = path.split('/api/user-sessions/')[1]
        get_user_sessions(email)
    elif path == '/api/register' and method == 'POST':
        register_for_session()
    elif path == '/api/register' and method == 'DELETE':
        unregister_from_session()
    else:
        st.json({"error": "Invalid endpoint or method"}, status_code=404)

# API implementations
def get_all_users():
    conn = sqlite3.connect('mlmarch.db')
    users_df = pd.read_sql_query("SELECT * FROM users", conn)
    conn.close()
    
    # Convert DataFrame to list of dictionaries for JSON response
    users = users_df.to_dict(orient='records')
    st.json(users)

def get_user_by_email(email):
    conn = sqlite3.connect('mlmarch.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = c.fetchone()
    conn.close()
    
    if user:
        columns = [desc[0] for desc in c.description]
        user_dict = dict(zip(columns, user))
        st.json(user_dict)
    else:
        st.json({"error": "User not found"}, status_code=404)

def create_or_update_user():
    # Get request body from Streamlit query params
    try:
        params = get_query_params()
        data_str = params.get('data', ['{}'])[0]
        data = json.loads(data_str)
        
        # Required fields
        if 'email' not in data:
            st.json({"error": "Email is required"}, status_code=400)
            return
            
        conn = sqlite3.connect('mlmarch.db')
        c = conn.cursor()
        
        # Check if user exists
        c.execute("SELECT id FROM users WHERE email = ?", (data['email'],))
        existing_user = c.fetchone()
        
        now = datetime.now().isoformat()
        
        if existing_user:
            # Update existing user
            user_id = existing_user[0]
            fields = []
            values = []
            
            for key, value in data.items():
                if key != 'email' and key != 'id':
                    fields.append(f"{key} = ?")
                    values.append(value)
            
            fields.append("updated_at = ?")
            values.append(now)
            values.append(user_id)
            
            query = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
            c.execute(query, values)
            
            result = {"id": user_id, "updated": True}
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            
            # Prepare fields and values for insert
            fields = ['id', 'email', 'created_at', 'updated_at']
            values = [user_id, data['email'], now, now]
            
            for key, value in data.items():
                if key != 'email' and key != 'id':
                    fields.append(key)
                    values.append(value)
            
            placeholders = ', '.join(['?' for _ in fields])
            query = f"INSERT INTO users ({', '.join(fields)}) VALUES ({placeholders})"
            c.execute(query, values)
            
            result = {"id": user_id, "created": True}
        
        conn.commit()
        conn.close()
        
        st.json(result)
    except Exception as e:
        st.json({"error": str(e)}, status_code=500)

def get_all_sessions():
    conn = sqlite3.connect('mlmarch.db')
    sessions_df = pd.read_sql_query("SELECT * FROM sessions", conn)
    conn.close()
    
    # Convert DataFrame to list of dictionaries for JSON response
    sessions = sessions_df.to_dict(orient='records')
    st.json(sessions)

def get_session_by_id(session_id):
    conn = sqlite3.connect('mlmarch.db')
    c = conn.cursor()
    c.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    session = c.fetchone()
    conn.close()
    
    if session:
        columns = [desc[0] for desc in c.description]
        session_dict = dict(zip(columns, session))
        st.json(session_dict)
    else:
        st.json({"error": "Session not found"}, status_code=404)

def get_user_sessions(email):
    conn = sqlite3.connect('mlmarch.db')
    c = conn.cursor()
    
    # First get the user ID
    c.execute("SELECT id FROM users WHERE email = ?", (email,))
    user = c.fetchone()
    
    if not user:
        conn.close()
        st.json({"error": "User not found"}, status_code=404)
        return
    
    user_id = user[0]
    
    # Get all sessions this user is registered for
    query = """
    SELECT s.*, us.registered_at, us.attended
    FROM sessions s
    JOIN user_sessions us ON s.id = us.session_id
    WHERE us.user_id = ?
    """
    
    sessions_df = pd.read_sql_query(query, conn, params=(user_id,))
    conn.close()
    
    # Convert DataFrame to list of dictionaries for JSON response
    sessions = sessions_df.to_dict(orient='records')
    st.json(sessions)

def register_for_session():
    try:
        params = get_query_params()
        data_str = params.get('data', ['{}'])[0]
        data = json.loads(data_str)
        
        # Required fields
        if 'email' not in data or 'session_id' not in data:
            st.json({"error": "Email and session_id are required"}, status_code=400)
            return
            
        conn = sqlite3.connect('mlmarch.db')
        c = conn.cursor()
        
        # Get user ID
        c.execute("SELECT id FROM users WHERE email = ?", (data['email'],))
        user = c.fetchone()
        
        if not user:
            conn.close()
            st.json({"error": "User not found"}, status_code=404)
            return
            
        user_id = user[0]
        
        # Check if session exists
        c.execute("SELECT id FROM sessions WHERE id = ?", (data['session_id'],))
        session = c.fetchone()
        
        if not session:
            conn.close()
            st.json({"error": "Session not found"}, status_code=404)
            return
            
        # Check if already registered
        c.execute("SELECT * FROM user_sessions WHERE user_id = ? AND session_id = ?", 
                 (user_id, data['session_id']))
        existing = c.fetchone()
        
        if existing:
            conn.close()
            st.json({"message": "Already registered for this session"})
            return
            
        # Register for session
        now = datetime.now().isoformat()
        c.execute("INSERT INTO user_sessions (user_id, session_id, registered_at) VALUES (?, ?, ?)",
                 (user_id, data['session_id'], now))
        
        conn.commit()
        conn.close()
        
        st.json({"registered": True, "session_id": data['session_id']})
    except Exception as e:
        st.json({"error": str(e)}, status_code=500)

def unregister_from_session():
    try:
        params = get_query_params()
        data_str = params.get('data', ['{}'])[0]
        data = json.loads(data_str)
        
        # Required fields
        if 'email' not in data or 'session_id' not in data:
            st.json({"error": "Email and session_id are required"}, status_code=400)
            return
            
        conn = sqlite3.connect('mlmarch.db')
        c = conn.cursor()
        
        # Get user ID
        c.execute("SELECT id FROM users WHERE email = ?", (data['email'],))
        user = c.fetchone()
        
        if not user:
            conn.close()
            st.json({"error": "User not found"}, status_code=404)
            return
            
        user_id = user[0]
            
        # Unregister
        c.execute("DELETE FROM user_sessions WHERE user_id = ? AND session_id = ?", 
                 (user_id, data['session_id']))
        
        if c.rowcount > 0:
            result = {"unregistered": True, "session_id": data['session_id']}
        else:
            result = {"message": "Not registered for this session"}
        
        conn.commit()
        conn.close()
        
        st.json(result)
    except Exception as e:
        st.json({"error": str(e)}, status_code=500)

# Main entry point
if __name__ == "__main__":
    handle_request()