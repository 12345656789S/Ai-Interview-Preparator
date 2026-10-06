import React, { useEffect, useRef, useState } from "react";
import "./AIInterview.css";

const API = "http://localhost:5000/api/interview";

export default function AIInterview() {
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState([]);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [ended, setEnded] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const recognitionRef = useRef(null);

  // Timer
  useEffect(() => {
    if (!started || ended) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [started, ended]);

  const formatTime = () => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");

    return `${mins}:${secs}`;
  };

  // AI voice
  const speak = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      const speech = new SpeechSynthesisUtterance(text);
      speech.rate = 0.95;
      speech.pitch = 1;
      speech.volume = 1;

      window.speechSynthesis.speak(speech);
    }
  };

  // Get next question
  const getNextQuestion = async (currentHistory = []) => {
    try {
      setLoading(true);

      const response = await fetch(`${API}/next`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history: currentHistory,
          resumeText: "",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to generate question");
      }

      setQuestion(data.question);
      speak(data.question);
    } catch (error) {
      console.error(error);
      alert(
        "Unable to connect with AI interviewer. Please make sure your backend and OpenAI API are running."
      );
    } finally {
      setLoading(false);
    }
  };

  // Start interview
  const startInterview = async () => {
    setStarted(true);
    setEnded(false);
    setFeedback("");
    setTranscript("");
    setHistory([]);
    setSeconds(0);

    await getNextQuestion([]);
  };

  // Start microphone
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    if (listening) return;

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      setTranscript((prev) => {
        const existing = prev.trim();

        if (finalText.trim()) {
          return `${existing} ${finalText}`.trim();
        }

        return `${existing} ${interimText}`.trim();
      });
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Stop microphone
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setListening(false);
  };

  // Submit answer
  const submitAnswer = async () => {
    if (!transcript.trim()) {
      alert("Please answer the question before submitting.");
      return;
    }

    stopListening();

    const newHistory = [
      ...history,
      {
        role: "assistant",
        content: question,
      },
      {
        role: "user",
        content: transcript,
      },
    ];

    setHistory(newHistory);
    setTranscript("");

    await getNextQuestion(newHistory);
  };

  // End interview
  const endInterview = async () => {
    stopListening();

    window.speechSynthesis?.cancel();

    try {
      setLoading(true);

      const response = await fetch(`${API}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Feedback generation failed");
      }

      setFeedback(data.feedback);
      setEnded(true);
    } catch (error) {
      console.error(error);
      alert("Unable to generate interview feedback.");
    } finally {
      setLoading(false);
    }
  };

  // Reset
  const restartInterview = () => {
    window.speechSynthesis?.cancel();

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setStarted(false);
    setEnded(false);
    setQuestion("");
    setTranscript("");
    setHistory([]);
    setFeedback("");
    setListening(false);
    setSeconds(0);
  };

  // Welcome screen
  if (!started) {
    return (
      <div className="interview-page">
        <div className="welcome-card">
          <div className="welcome-icon">🤖</div>

          <p className="eyebrow">PREPPILOT AI</p>

          <h1>AI Mock Interview</h1>

          <p className="welcome-text">
            Experience a realistic AI-powered interview. The AI interviewer
            will ask questions, listen to your answers and provide feedback
            on your performance.
          </p>

          <div className="interview-features">
            <div>
              <span>🎤</span>
              <strong>Voice Interview</strong>
              <small>Speak naturally</small>
            </div>

            <div>
              <span>🧠</span>
              <strong>AI Questions</strong>
              <small>Dynamic questions</small>
            </div>

            <div>
              <span>📊</span>
              <strong>Performance</strong>
              <small>Detailed feedback</small>
            </div>
          </div>

          <button className="start-btn" onClick={startInterview}>
            Start Mock Interview
            <span>→</span>
          </button>

          <p className="browser-note">
            🎙️ Use Google Chrome and allow microphone access.
          </p>
        </div>
      </div>
    );
  }

  // Final feedback screen
  if (ended) {
    return (
      <div className="interview-page">
        <div className="feedback-card">
          <div className="complete-icon">✓</div>

          <p className="eyebrow">INTERVIEW COMPLETE</p>

          <h1>Your Interview Feedback</h1>

          <div className="feedback-box">
            {feedback}
          </div>

          <button className="start-btn" onClick={restartInterview}>
            Start New Interview
            <span>↻</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mock-interview">
      {/* TOP BAR */}
      <header className="interview-header">
        <div className="brand">
          <div className="brand-logo">P</div>
          <div>
            <strong>PrepPilot<span>AI</span></strong>
            <small>AI Mock Interview</small>
          </div>
        </div>

        <div className="interview-status">
          <div className="live-dot"></div>
          LIVE INTERVIEW
        </div>

        <div className="header-right">
          <div className="timer">
            <span>◷</span>
            {formatTime()}
          </div>

          <button className="end-btn" onClick={endInterview}>
            End Interview
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="interview-main">
        {/* LEFT AI PANEL */}
        <section className="ai-panel">
          <div className="ai-avatar">
            <div className="avatar-face">
              <div className="eyes">
                <span></span>
                <span></span>
              </div>
              <div className="mouth"></div>
            </div>

            <div className="avatar-ring ring-one"></div>
            <div className="avatar-ring ring-two"></div>
          </div>

          <h2>AI Interviewer</h2>

          <p className={loading ? "ai-speaking" : ""}>
            {loading
              ? "Thinking of your next question..."
              : "I'm listening to your answer"}
          </p>

          <div className="ai-wave">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </div>

          <div className="interviewer-info">
            <div>
              <span>Interview Type</span>
              <strong>Technical + HR</strong>
            </div>

            <div>
              <span>Mode</span>
              <strong>AI Voice</strong>
            </div>
          </div>
        </section>

        {/* RIGHT CONTENT */}
        <section className="question-panel">
          <div className="progress-row">
            <div>
              <span>QUESTION</span>
              <strong>{Math.min(history.length / 2 + 1, 10)} / 10</strong>
            </div>

            <div className="progress-bar">
              <div
                style={{
                  width: `${Math.min(
                    ((history.length / 2 + 1) / 10) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="question-card">
            <div className="question-label">
              <span>AI INTERVIEWER</span>
              <div className="sound-icon">🔊</div>
            </div>

            <h1>
              {loading
                ? "Preparing your next question..."
                : question || "Tell me about yourself."}
            </h1>
          </div>

          <div className="answer-area">
            <div className="answer-header">
              <span>Your Answer</span>

              {listening && (
                <span className="recording">
                  <i></i> Recording
                </span>
              )}
            </div>

            <div className={`transcript-box ${listening ? "active" : ""}`}>
              {transcript ? (
                <p>{transcript}</p>
              ) : (
                <p className="placeholder">
                  {listening
                    ? "I'm listening... Start speaking."
                    : "Your spoken answer will appear here..."}
                </p>
              )}
            </div>

            <div className="controls">
              {!listening ? (
                <button
                  className="mic-btn"
                  onClick={startListening}
                  disabled={loading}
                >
                  <span className="mic-icon">🎙️</span>
                  Start Speaking
                </button>
              ) : (
                <button className="stop-btn" onClick={stopListening}>
                  <span>■</span>
                  Stop Recording
                </button>
              )}

              <button
                className="submit-btn"
                onClick={submitAnswer}
                disabled={loading || !transcript.trim()}
              >
                Submit Answer
                <span>→</span>
              </button>
            </div>
          </div>

          <div className="tip">
            <span>💡</span>
            <p>
              <strong>Interview Tip:</strong> Speak clearly and explain your
              answers with a real example whenever possible.
            </p>
          </div>
        </section>
      </main>

      <footer className="interview-footer">
        <span>PrepPilotAI</span>
        <span>•</span>
        <span>AI-powered interview practice</span>
      </footer>
    </div>
  );
}