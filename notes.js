const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.pdf': 'application/pdf'
};

// MySQL connection configuration
const mysqlConfig = {
    host: 'localhost',
    user: 'notes_user',    // Change this to your MySQL username
    password: 'qWeR_1234', // Change this to your MySQL password
    database: 'notes_db'   // Change this to your database name
};

// Create MySQL connection pool
let connectionPool;

async function createConnection() {
    try {
        connectionPool = mysql.createPool(mysqlConfig);
        console.log('MySQL connection pool created successfully');
    } catch (error) {
        console.error('Error creating MySQL connection pool:', error);
    }
}

// Initialize MySQL connection
createConnection();

const server = http.createServer(async (req, res) => {
    const url = req.url === '/' ? '/index' : req.url;
    const filePath = path.join(__dirname, url);
    const extname = path.extname(filePath);
    
    // Handle SQL query endpoint
    if (url === '/query' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const { sql } = JSON.parse(body);
                
                if (!connectionPool) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'MySQL connection not available' }));
                    return;
                }
                
                const connection = await connectionPool.getConnection();
                const [results] = await connection.execute(sql);
                connection.release();
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    results: results,
                    rowCount: results.length || 0
                }));
                
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: error.message,
                    sql: sql || 'No SQL provided'
                }));
            }
        });
        return;
    }
    
    // Serve static files
    if (extname && extname !== '.html') {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
                return;
            }
            
            const contentType = mimeTypes[extname] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
        return;
    }
    
    // Generate main HTML page
    if (url === '/index' || url === '/') {
        // Get list of files in current directory
        fs.readdir(__dirname, (err, files) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error reading directory');
                return;
            }
            
            // Filter out hidden files and directories
            const visibleFiles = files.filter(file => 
                !file.startsWith('.') && 
                file !== 'node_modules' &&
                fs.statSync(path.join(__dirname, file)).isFile()
            );
            
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Node.js Server with MySQL</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to My Node.js Server!</h1>
        <p>This is a simple HTTP server built with Node.js that generates a minimal HTML page, serves static files, and connects to MySQL.</p>
        
        <div class="timestamp">
            <strong>Server Time:</strong> ${new Date().toLocaleString()}
        </div>
        
        <div class="sql-interface">
            <h3>MySQL Query Interface</h3>
            <div class="form-group">
                <label for="sqlQuery">Enter SQL Query:</label>
                <textarea id="sqlQuery" placeholder="SELECT * FROM your_table LIMIT 10;" rows="4"></textarea>
            </div>
            <button onclick="executeQuery()" class="btn-primary">Execute Query</button>
            
            <div id="queryResults" class="query-results"></div>
        </div>
        
        <div class="file-list">
            <h3>Files in Current Directory:</h3>
            ${visibleFiles.map(file => `
                <div class="file-item">
                    <a href="/${file}" target="_blank">${file}</a>
                </div>
            `).join('')}
        </div>
        
        <p>The server is running successfully and can serve any files from the current directory and execute MySQL queries.</p>
    </div>
    
    <script>
        async function executeQuery() {
            const sqlQuery = document.getElementById('sqlQuery').value.trim();
            const resultsDiv = document.getElementById('queryResults');
            
            if (!sqlQuery) {
                resultsDiv.innerHTML = '<div class="error">Please enter a SQL query</div>';
                return;
            }
            
            try {
                resultsDiv.innerHTML = '<div class="loading">Executing query...</div>';
                
                const response = await fetch('/query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ sql: sqlQuery })
                });
                
                const data = await response.json();
                
                if (data.error) {
                    resultsDiv.innerHTML = '<div class="error">Error: ' + data.error + '</div>';
                } else {
                    let resultsHtml = '<div class="success">Query executed successfully!</div>';
                    resultsHtml += '<div class="row-count">Rows returned: ' + data.rowCount + '</div>';
                    
                    if (data.results && data.results.length > 0) {
                        resultsHtml += '<div class="results-table">';
                        resultsHtml += '<table><thead><tr>';
                        
                        // Create table headers from first result
                        const columns = Object.keys(data.results[0]);
                        columns.forEach(col => {
                            resultsHtml += '<th>' + col + '</th>';
                        });
                        resultsHtml += '</tr></thead><tbody>';
                        
                        // Add data rows
                        data.results.forEach(row => {
                            resultsHtml += '<tr>';
                            columns.forEach(col => {
                                resultsHtml += '<td>' + (row[col] !== null ? row[col] : 'NULL') + '</td>';
                            });
                            resultsHtml += '</tr>';
                        });
                        
                        resultsHtml += '</tbody></table></div>';
                    }
                    
                    resultsDiv.innerHTML = resultsHtml;
                }
            } catch (error) {
                resultsDiv.innerHTML = '<div class="error">Network error: ' + error.message + '</div>';
            }
        }
    </script>
</body>
</html>`;
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        });
        return;
    }
    
    // Handle other HTML routes
    fs.readFile(filePath + '.html', (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Page not found');
            return;
        }
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Press Ctrl+C to stop the server`);
    console.log(`Serving files from: ${__dirname}`);
    console.log(`MySQL connection configured for: ${mysqlConfig.host}/${mysqlConfig.database}`);
});
