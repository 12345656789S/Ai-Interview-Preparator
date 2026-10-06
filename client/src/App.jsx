import { useRef, useState } from "react";

import {
  Routes,
  Route,
  useNavigate
} from "react-router-dom";

import QuestionsPage from "./pages/QuestionsPage.jsx";
import MockInterview from "./pages/MockInterview.jsx";
import AIInterview from "./pages/AIInterview";
import "./App.css";


// ======================================================
// HOME PAGE
// ======================================================

function HomePage() {
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState("");

  const [resumeId, setResumeId] = useState(null);

  const [generatingQuestions, setGeneratingQuestions] =
    useState(false);

  const [showQuestionPopup, setShowQuestionPopup] =
    useState(false);

  const [generatedQuestions, setGeneratedQuestions] =
    useState([]);

  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");


  // ======================================================
  // UPLOAD BUTTON
  // ======================================================

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };


  // ======================================================
  // FILE UPLOAD
  // ======================================================

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a PDF or DOCX file.");
      setUploadSuccess(false);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Resume size must be less than 5MB.");
      setUploadSuccess(false);
      return;
    }

    setUploading(true);
    setUploadSuccess(false);
    setError("");
    setResumeId(null);
    setGeneratedQuestions([]);
    setShowQuestionPopup(false);

    const formData = new FormData();

    formData.append("resume", file);

    try {
      const response = await fetch(
        "http://localhost:5000/api/resume/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Resume upload failed."
        );
      }

      setResumeId(data.resumeId);

      setUploadSuccess(true);

      setError("");

      console.log("Resume uploaded:", data);
      console.log("Resume ID:", data.resumeId);

    } catch (err) {

      console.error("Resume upload error:", err);

      setError(
        err.message || "Resume upload failed."
      );

      setUploadSuccess(false);
      setResumeId(null);

    } finally {

      setUploading(false);

    }
  };


  // ======================================================
  // GENERATE QUESTIONS
  // ======================================================

  const handleGenerateQuestions = async () => {

    if (!resumeId) {
      setError("Please upload your resume first.");
      return;
    }

    setGeneratingQuestions(true);
    setError("");

    try {

      const response = await fetch(
        `http://localhost:5000/api/questions/generate/${resumeId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to generate questions."
        );
      }

      const newQuestions = data.questions || [];

      setGeneratedQuestions(newQuestions);

      setShowQuestionPopup(true);

      console.log(
        "Generated Questions:",
        data
      );

    } catch (err) {

      console.error(
        "Generate questions error:",
        err
      );

      setError(
        err.message ||
        "Failed to generate questions."
      );

    } finally {

      setGeneratingQuestions(false);

    }
  };


  // ======================================================
  // START MOCK INTERVIEW FROM HOME
  // ======================================================

  const handleMockInterview = () => {

    if (!resumeId) {
      setError("Please upload your resume first.");
      return;
    }

    if (generatedQuestions.length === 0) {

      setError(
        "Please generate interview questions first."
      );

      return;
    }

    if (!isLoggedIn) {

      setShowLogin(true);

      return;
    }

    navigate("/mock-interview", {
      state: {
        questions: generatedQuestions,
        resumeId: resumeId
      }
    });
  };


  // ======================================================
  // LOGIN
  // ======================================================

  const handleLogin = (event) => {

    event.preventDefault();

    if (!loginEmail || !loginPassword) {

      setError(
        "Please enter email and password."
      );

      return;
    }

    // Temporary frontend login
    setIsLoggedIn(true);

    setShowLogin(false);

    setError("");

    setLoginEmail("");
    setLoginPassword("");

    // If questions already exist,
    // continue directly to mock interview.

    if (
      generatedQuestions.length > 0 &&
      resumeId
    ) {

      navigate("/mock-interview", {
        state: {
          questions: generatedQuestions,
          resumeId: resumeId
        }
      });

    } else {

      alert(
        "✅ Login successful!"
      );

    }
  };


  // ======================================================
  // START PREPARING
  // ======================================================

  const handleStartPreparing = () => {

    document
      .querySelector(".features")
      ?.scrollIntoView({
        behavior: "smooth",
      });

  };


  // ======================================================
  // HOME PAGE UI
  // ======================================================

  return (

    <div className="app">

      {/* ================= NAVBAR ================= */}

      <nav className="navbar">

        <div className="logo">
          🤖 PrepPilot <span>AI</span>
        </div>

        <div className="nav-links">

          <a href="#">
            Home
          </a>

          <a href="#">
            Resume Analyzer
          </a>

          <a href="#">
            Practice
          </a>

          <a href="#">
            AI Interview
          </a>

        </div>

        <button
          className="login-btn"
          onClick={() => setShowLogin(true)}
        >

          {isLoggedIn
            ? "Logged In"
            : "Login"}

        </button>

      </nav>


      {/* ================= HERO ================= */}

      <section className="hero">


        {/* ================= LEFT SIDE ================= */}

        <div className="hero-text">

          <div className="badge">

            ✨ AI-Powered Interview Preparation

          </div>


          <h1>

            Ace Your Next

            <span> Interview </span>

            With AI

          </h1>


          <p>

            Upload your resume, get personalized
            interview questions, practice with AI
            and become confident for your next interview.

          </p>


          <div className="hero-buttons">

            <button
              className="primary-btn"
              onClick={handleStartPreparing}
            >

              🚀 Start Preparing

            </button>

          </div>

        </div>


        {/* ================= RIGHT RESUME PORTAL ================= */}

        <div className="resume-portal">


          <div className="resume-portal-header">

            <div className="resume-icon">
              📄
            </div>

            <h2>
              Upload Your Resume
            </h2>

            <p>

              Upload your resume and let PrepPilot AI
              personalize your interview preparation.

            </p>

          </div>


          {/* HIDDEN FILE INPUT */}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx"
            style={{
              display: "none"
            }}
          />


          {/* UPLOAD AREA */}

          <div
            className="resume-upload-area"
            onClick={handleUploadClick}
          >

            <div className="upload-cloud">
              ☁️
            </div>

            <h3>
              Drop your resume here
            </h3>

            <p>
              or click to browse from your computer
            </p>

            <span>
              PDF or DOCX • Max 5MB
            </span>

          </div>


          {/* UPLOAD BUTTON */}

          <button
            className="resume-upload-btn"
            onClick={handleUploadClick}
            disabled={uploading}
          >

            {uploading
              ? "⏳ Uploading..."
              : "📄 Choose & Upload Resume"}

          </button>


          {/* ERROR */}

          {error && (

            <div className="error-message">

              ❌ {error}

            </div>

          )}


          {/* ================= UPLOAD SUCCESS ================= */}

          {uploadSuccess && (

            <div className="upload-success">

              <div className="success-message">

                ✅ Resume uploaded successfully!

              </div>


              <div className="next-actions">


                {/* GENERATE QUESTIONS */}

                <button
                  className="primary-btn"
                  onClick={handleGenerateQuestions}
                  disabled={generatingQuestions}
                >

                  {generatingQuestions
                    ? "🧠 Generating..."
                    : "🧠 Generate Questions"}

                </button>


                {/* MOCK INTERVIEW */}

                <button
                  className="secondary-btn"
                  onClick={handleMockInterview}
                >

                  🎤 AI Mock Interview

                </button>


              </div>

            </div>

          )}

        </div>

      </section>


      {/* ================= FEATURES ================= */}

      <section className="features">

        <h2>

          Everything You Need to Crack Your Interview

        </h2>

        <p className="section-subtitle">

          Prepare smarter with AI-powered interview tools.

        </p>


        <div className="feature-container">


          <div className="feature-card">

            <div className="feature-icon">
              📄
            </div>

            <h3>
              Resume Analysis
            </h3>

            <p>

              Upload your resume and let AI identify
              your skills, projects and experience.

            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">
              🧠
            </div>

            <h3>
              Smart Questions
            </h3>

            <p>

              Get interview questions generated
              specifically from your resume.

            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">
              🎤
            </div>

            <h3>
              AI Mock Interview
            </h3>

            <p>

              Practice real interview conversations
              with your personal AI interviewer.

            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">
              📊
            </div>

            <h3>
              Performance Report
            </h3>

            <p>

              Get scores, feedback and suggestions
              to improve your interview performance.

            </p>

          </div>

        </div>

      </section>


      {/* ================= HOW IT WORKS ================= */}

      <section className="how-it-works">

        <h2>
          How PrepPilot AI Works
        </h2>


        <div className="steps">


          <div className="step">

            <div>
              01
            </div>

            <h3>
              Upload Resume
            </h3>

            <p>
              Upload your resume in PDF or DOCX format.
            </p>

          </div>


          <div className="step">

            <div>
              02
            </div>

            <h3>
              AI Analysis
            </h3>

            <p>
              AI analyzes your skills and experience.
            </p>

          </div>


          <div className="step">

            <div>
              03
            </div>

            <h3>
              Practice
            </h3>

            <p>
              Answer personalized interview questions.
            </p>

          </div>


          <div className="step">

            <div>
              04
            </div>

            <h3>
              AI Interview
            </h3>

            <p>
              Take a complete AI-powered mock interview.
            </p>

          </div>


        </div>

      </section>


      {/* ================= FOOTER ================= */}

      <footer>

        <h3>
          🤖 PrepPilot AI
        </h3>

        <p>
          Your AI-powered interview preparation partner.
        </p>

        <p>
          © 2026 PrepPilot AI
        </p>

      </footer>


      {/* ======================================================
          QUESTIONS GENERATED POPUP
          ====================================================== */}

      {showQuestionPopup && (

        <div className="login-overlay">

          <div className="login-modal">

            <div className="login-icon">
              🧠
            </div>


            <h2>
              Questions Generated!
            </h2>


            <p>

              Your personalized interview questions
              are ready.

            </p>


            <button
              className="primary-btn"
              onClick={() => {

                setShowQuestionPopup(false);

                navigate("/questions", {

                  state: {

                    questions: generatedQuestions,

                    resumeId: resumeId

                  }

                });

              }}
            >

              👀 View Questions

            </button>

          </div>

        </div>

      )}


      {/* ======================================================
          LOGIN MODAL
          ====================================================== */}

      {showLogin && (

        <div className="login-overlay">

          <div className="login-modal">


            <button
              className="login-close"
              onClick={() => {

                setShowLogin(false);

                setError("");

              }}
            >

              ✕

            </button>


            <div className="login-icon">
              🔐
            </div>


            <h2>
              Login Required
            </h2>


            <p>

              Please login before starting
              your AI Mock Interview.

            </p>


            <form onSubmit={handleLogin}>


              <input
                type="email"
                placeholder="Enter your email"
                value={loginEmail}
                onChange={(e) =>
                  setLoginEmail(e.target.value)
                }
              />


              <input
                type="password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) =>
                  setLoginPassword(e.target.value)
                }
              />


              <button
                type="submit"
                className="primary-btn login-submit"
              >

                🔑 Login & Continue

              </button>


            </form>

          </div>

        </div>

      )}

    </div>

  );
}


// ======================================================
// MAIN APP ROUTES
// ======================================================

function App() {

  return (

    <Routes>

      {/* HOME */}
<Route path="/ai-interview" element={<AIInterview />} />
      <Route
        path="/"
        element={<HomePage />}
      />


      {/* QUESTIONS PAGE */}

      <Route
        path="/questions"
        element={<QuestionsPage />}
      />


      {/* MOCK INTERVIEW PAGE */}

      <Route
        path="/mock-interview"
        element={<MockInterview />}
      />

    </Routes>

  );
}


export default App;