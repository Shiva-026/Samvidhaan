const mysql = require("mysql");

const db = mysql.createConnection({
    host: "localhost",  // Change if using a remote database
    user: "root",       // Your MySQL username
    password: "Shiva@38",       // Your MySQL password (keep empty if no password)
    database: "samvidhan", // Change this to your actual DB name
    port: 3306          // Defult MySQL port
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
        return;
    }
    console.log("✅ Connected to MySQL Database!");
});

module.exports = db;
