 
require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const { Pool } = require("pg");
 

const app = express();
app.use(express.static(path.join(__dirname, "../careertrack-frontend"))); 

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../careertrack-frontend/index.html"));
});

app.use(cors());
app.use(express.json());


// ---------------- DATABASE ----------------
// const pool = new Pool({
//   user: "postgres",
//   host: "localhost",
//   database: "careertrack",
//   password: "varadmin123",
//   port: 5432,
// });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect()
  .then(() => console.log("Database connected successfully ✅"))
  .catch(err => console.error("DB Connection Error:", err.message));


// // ---------------- TEST ROUTE ----------------
// app.get("/", (req, res) => {
//   res.send("CareerTrack Backend Running 🚀");
// });


// ---------------- REGISTER ----------------
app.post("/register", async (req, res) => {

  const { name, email, password } = req.body;

  try {

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name,email,password)
       VALUES ($1,$2,$3)
       RETURNING id,name,email`,
      [name, email, hashedPassword]
    );

    res.json({
      message: "User registered successfully",
      user: result.rows[0]
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Registration failed" });

  }

});


// ---------------- LOGIN ----------------
app.post("/login", async (req, res) => {

  const { email, password } = req.body;

  try {

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    res.json({
      message: "Login successful"
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Login failed" });

  }

});


// ---------------- ADD APPLICATION ----------------
app.post("/addApplication", async (req, res) => {

  try {
    console.log("Request body:", req.body);

    let { company, role, status, applied_date } = req.body;
    if (!company || !role) {
  return res.status(400).json({ error: "Company and role are required" });
}

if (applied_date) {

  const parts = applied_date.includes("/")
    ? applied_date.split("/")
    : applied_date.split("-");

  if (parts.length === 3) {

    const [day, month, year] = parts;

    applied_date = `${year}-${month}-${day}`;

  }

}

    await pool.query(
      `INSERT INTO applications (company,role,status,applied_date)
       VALUES ($1,$2,$3,$4)`,
      [company, role, status, applied_date]
    );

    res.json({ message: "Application added successfully" });

  } catch (err) {

    console.error(err);
       console.error("Database error:", err); 
    res.status(500).send("Error inserting data");

  }

});


// ---------------- GET APPLICATIONS ----------------
app.get("/applications", async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT * FROM applications ORDER BY applied_date DESC"
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Failed to fetch applications" });

  }

});


// ---------------- GET SINGLE APPLICATION ----------------
app.get("/applications/:id", async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM applications WHERE id=$1",
      [id]
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);
    res.status(500).send("Error fetching application");

  }

});


// ---------------- UPDATE APPLICATION ----------------
app.put("/applications/:id", async (req, res) => {

  try {

    const { id } = req.params;
    const { company_name, role, status, applied_date } = req.body;

    await pool.query(
      `UPDATE applications
       SET company=$1,
           role=$2,
           status=$3,
           applied_date=$4
       WHERE id=$5`,
      [company_name, role, status, applied_date, id]
    );

    res.json({ message: "Application updated successfully" });

  } catch (err) {

    console.error(err);
    res.status(500).send("Error updating application");

  }

});


// ---------------- DELETE APPLICATION ----------------
app.delete("/applications/:id", async (req, res) => {

  try {

    const { id } = req.params;

    await pool.query(
      `DELETE FROM applications WHERE id=$1`,
      [id]
    );

    res.json({ message: "Application deleted successfully" });

  } catch (err) {

    console.error(err);
    res.status(500).send("Error deleting application");

  }

});


// ---------------- TOTAL STATS ----------------
app.get("/stats/total", async (req, res) => {

  const result = await pool.query(
    `SELECT COUNT(*) FROM applications`
  );

  res.json({
    total: Number(result.rows[0].count)
  });

});


// ---------------- TODAY STATS ----------------
app.get("/stats/today", async (req, res) => {

  const result = await pool.query(`
    SELECT COUNT(*)
    FROM applications
    WHERE applied_date::date = CURRENT_DATE
  `);

  res.json({
    today: Number(result.rows[0].count)
  });

});


// ---------------- STATUS COUNTS ----------------
app.get("/stats/statusCounts", async (req, res) => {

  const result = await pool.query(`
    SELECT status, COUNT(*)
    FROM applications
    GROUP BY status
  `);

  const counts = {
    Applied: 0,
    Interview: 0,
    Rejected: 0,
    Offer: 0
  };

  result.rows.forEach(row => {
    counts[row.status] = Number(row.count);
  });

  res.json(counts);

});


// ---------------- STATUS CHART ----------------
app.get("/stats/status", async (req, res) => {

  const result = await pool.query(`
    SELECT status, COUNT(*)
    FROM applications
    GROUP BY status
  `);

  res.json(result.rows);

});


// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
}); 

 
