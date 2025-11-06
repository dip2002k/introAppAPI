// Import the Express module
import express from "express";
import cors from "cors";

// Import the routes modules
import userRoutes from "./routes/user.js";
import authRoutes from "./routes/auth.js";
import wellnessRoutes from "./routes/wellness.js";
// Create an Express application
const app = express();

// Use the PORT environment variable or 3000
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false })); // To parse the incoming requests with urlencoded payloads. For example, form data
app.use(express.json()); // To parse the incoming requests with JSON payloads. For example, REST API requests
app.use(cors()); // So the website localhost port has access to make req and res to our API port

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use('/api/wellness', wellnessRoutes);

// Start the server on port 3000
app.listen(PORT, () => {
  console.log(
    `Server is listening on port ${PORT}. Visit http://localhost:${PORT}`,
  );
});

// Export the Express application. May be used by other modules. For example, API testing
export default app;
