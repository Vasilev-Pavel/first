# Simple Node.js Server with MySQL Interface

A simple HTTP server built with Node.js that generates a minimal HTML page, serves static files, and provides a MySQL query interface.

## Features

- **Static File Server**: Serves files from the current directory
- **MySQL Integration**: Execute SQL queries directly from the web interface
- **Dynamic HTML Generation**: Creates pages on-the-fly
- **File Browser**: Lists all files in the current directory
- **Responsive Design**: Modern, clean UI with CSS styling

## Prerequisites

- Node.js (version 14 or higher)
- MySQL server running on localhost
- MySQL user credentials

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure MySQL connection:**
   Edit `notes.js` and update the `mysqlConfig` object with your MySQL credentials:
   ```javascript
   const mysqlConfig = {
       host: 'localhost',
       user: 'your_username',     // Change this
       password: 'your_password', // Change this
       database: 'your_database'  // Change this
   };
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## Usage

1. **Access the web interface:**
   Open your browser and go to `http://localhost:3000`

2. **Execute SQL queries:**
   - Enter your SQL query in the textarea
   - Click "Execute Query" button
   - View results in a formatted table below

3. **Browse files:**
   - View all files in the current directory
   - Click on any file to download or view it

## Example SQL Queries

```sql
-- Show all tables in the database
SHOW TABLES;

-- Select data from a table
SELECT * FROM users LIMIT 10;

-- Create a new table
CREATE TABLE test_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert data
INSERT INTO test_table (name) VALUES ('Test User');
```

## File Structure

```
├── notes.js          # Main server file
├── styles.css        # CSS styling
├── package.json      # Project dependencies
└── README.md         # This file
```

## Security Notes

⚠️ **Important**: This server is designed for development and local use only. It does not include:
- SQL injection protection
- User authentication
- Rate limiting
- HTTPS encryption

**Do not use in production environments without proper security measures.**

## Troubleshooting

### MySQL Connection Issues
- Ensure MySQL server is running
- Verify username, password, and database name
- Check if MySQL user has proper permissions
- Ensure MySQL is accessible on localhost:3306

### Port Already in Use
- Change the PORT variable in `notes.js`
- Or kill the process using the current port

## License

MIT License
