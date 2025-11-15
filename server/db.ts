import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

let db: any;

// Initialize MySQL
const initializeDatabase = async () => {
  try {
    const mysqlConnection = mysql.createPool(connectionString);
    // Test the connection before using it
    await mysqlConnection.query('SELECT 1');
    db = drizzle(mysqlConnection);
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('MySQL connection failed:', error);
    throw error;
  }
};

// Initialize database connection
initializeDatabase();

export { db };