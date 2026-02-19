const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.static("frontend"));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/frontend/login.html");
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/login", (req, res) => {
    res.send("Login route working");
});
// ===== CONNECT TO MONGODB ATLAS =====
mongoose.connect(
  "mongodb+srv://Admin:siddartha17@cluster0.hjojp16.mongodb.net/salesDB?retryWrites=true&w=majority"
)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


// ===== USER SCHEMA =====
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
});

const User = mongoose.model("User", userSchema);


// ================= SIGNUP =================
// ================= SIGNUP =================
app.post("/signup", async (req, res) => {

    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Missing fields" });
        }

        const existing = await User.findOne({ email });

        if (existing) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const newUser = new User({ name, email, password });

        await newUser.save();

        res.status(200).json({ message: "Signup successful" });

    } catch (error) {

        console.error(error);

        res.status(500).json({ message: "Server error" });
    }
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Missing fields" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "Email not found" });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        res.status(200).json({
            message: "Login successful",
            name: user.name,
            email: user.email
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

const { exec } = require("child_process");

app.post("/forecast", (req, res) => {

    exec("Rscript forecast_api.R", (error, stdout, stderr) => {

        if (error) {
            console.error(stderr);
            return res.status(500).json({ error: "R script failed" });
        }

        try {
            const result = JSON.parse(stdout);
            res.json(result);
        } catch {
            res.json({ output: stdout });
        }
    });

});


app.listen(5000, () => {
    console.log("Server running on port 5000");
});

