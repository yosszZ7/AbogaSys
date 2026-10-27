import os
import pyodbc
from dotenv import load_dotenv
from typing import Generator

ENV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv(dotenv_path=ENV_PATH)

def get_connection() -> Generator[pyodbc.Connection, None, None]:
    server = os.environ.get("DB_SERVER", "")
    database = os.environ.get("DB_DATABASE", "")
    user = os.environ.get("DB_USER", "")
    password = os.environ.get("DB_PASSWORD", "")
    driver = os.environ.get("DB_DRIVER", "ODBC Driver 17 for SQL Server")
    trust_cert = os.environ.get("DB_TRUST_SERVER_CERTIFICATE", "yes")
    
    connection_string = (
        f"DRIVER={{{driver}}};"
        f"SERVER={server};"
        f"DATABASE={database};"
        f"UID={user};"
        f"PWD={password};"
        f"TrustServerCertificate={trust_cert};"
    )
    
    conn = pyodbc.connect(connection_string)
    try:
        yield conn
    finally:
        conn.close()
