import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function MockInterview() {
  const location = useLocation();
  const navigate = useNavigate();

  const questions = location.state?.questions || [];
  const resumeId = location.state?.resumeId;

  const [currentIndex, setCurrentIndex] = useState(0);

  const [answer, setAnswer] = useState("");

  const [conversation, setConversation] = useState([]);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [evaluating, setEvaluating] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const [questionEvaluation, setQuestionEvaluation] =
    useState(null);

  const [evaluation, setEvaluation] = useState(null);

  const [finished, setFinished] = useState(false);

  const [error, setError] = useState("");

  const recognitionRef = useRef(null);

  /*
  ========================================================
  CURRENT QUESTION
  ========================================================
  */

  const currentQuestion =
    questions[currentIndex]?.question ||
    questions[currentIndex]?.text ||
    questions[currentIndex] ||
    "";


  /*
  ========================================================
  SPEAK AI QUESTION
  ========================================================
  */

  const speakQuestion = (text) => {
    if (!text) return;

    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(text);

    speech.rate = 0.95;
    speech.pitch = 1;
    speech.volume = 1;

    speech.onstart = () => {
      setIsSpeaking(true);
    };

    speech.onend = () => {
      setIsSpeaking(false);
    };

    speech.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(speech);
  };


  /*
  ========================================================
  SPEAK QUESTION WHEN PAGE OPENS / CHANGES
  ========================================================
  */

  useEffect(() => {
    if (!currentQuestion) return;

    const timer = setTimeout(() => {
      speakQuestion(currentQuestion);
    }, 700);

    return () => {
      clearTimeout(timer);

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentIndex, currentQuestion]);


  /*
  ========================================================
  CLEANUP
  ========================================================
  */

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log(error);
        }
      }
    };
  }, []);


  /*
  ========================================================
  START VOICE RECOGNITION
  ========================================================
  */

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Please use Google Chrome."
      );

      return;
    }

    window.speechSynthesis?.cancel();

    setIsSpeaking(false);

    setError("");

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.continuous = true;

    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const transcript =
          event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      setAnswer(
        (finalTranscript + interimTranscript).trim()
      );
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      setIsListening(false);

      if (event.error === "not-allowed") {
        setError(
          "Microphone permission was denied. Please allow microphone access."
        );
      } else {
        setError(
          "Could not recognize your speech. You can type your answer instead."
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error(error);
    }
  };


  /*
  ========================================================
  STOP LISTENING
  ========================================================
  */

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log(error);
      }
    }

    setIsListening(false);
  };


  /*
  ========================================================
  SUBMIT ANSWER
  ========================================================
  */

  const submitAnswer = async () => {
    if (!answer.trim()) {
      setError(
        "Please speak or type your answer before submitting."
      );

      return;
    }

    if (!currentQuestion) {
      setError("Interview question is missing.");

      return;
    }

    stopListening();

    window.speechSynthesis?.cancel();

    setEvaluating(true);

    setError("");

    try {
      /*
      ==============================================
      EVALUATE CURRENT ANSWER
      ==============================================
      */

      const response = await fetch(
        "http://localhost:5000/api/interview/evaluate-answer",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            question: currentQuestion,
            answer: answer.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to evaluate your answer."
        );
      }

      /*
      ==============================================
      SAVE CONVERSATION
      ==============================================
      */

      const newConversation = [
        ...conversation,

        {
          question: currentQuestion,

          answer: answer.trim(),

          evaluation: data.evaluation,
        },
      ];

      setConversation(newConversation);

      setQuestionEvaluation(data.evaluation);

    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Something went wrong while evaluating your answer."
      );
    } finally {
      setEvaluating(false);
    }
  };


  /*
  ========================================================
  NEXT QUESTION
  ========================================================
  */

  const nextQuestion = () => {
    setAnswer("");

    setQuestionEvaluation(null);

    setError("");

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(
        currentIndex + 1
      );

      return;
    }

    finishInterview();
  };


  /*
  ========================================================
  FINISH INTERVIEW
  ========================================================
  */

  const finishInterview = async () => {
    if (!conversation.length) {
      setError(
        "Please answer at least one question."
      );

      return;
    }

    stopListening();

    window.speechSynthesis?.cancel();

    setFinishing(true);

    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/interview/feedback",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            resumeId,

            conversation,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to generate final report."
        );
      }

      setEvaluation(data.evaluation);

      setFinished(true);

    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Could not generate final report."
      );
    } finally {
      setFinishing(false);
    }
  };


  /*
  ========================================================
  NO QUESTIONS
  ========================================================
  */

  if (!questions.length) {
    return (
      <div style={styles.emptyPage}>
        <div style={styles.emptyCard}>
          <div style={styles.bigEmoji}>
            🧠
          </div>

          <h2>
            No interview questions available
          </h2>

          <p>
            Please go back and generate interview
            questions from your resume first.
          </p>

          <button
            style={styles.primaryButton}
            onClick={() => navigate("/")}
          >
            🏠 Go Home
          </button>
        </div>
      </div>
    );
  }


  /*
  ========================================================
  FINAL RESULT
  ========================================================
  */

  if (finished) {
    return (
      <div style={styles.page}>
        <div style={styles.resultContainer}>

          <div style={styles.resultEmoji}>
            🎉
          </div>

          <h1 style={styles.resultTitle}>
            Interview Completed!
          </h1>

          <p style={styles.resultSubtitle}>
            Great job! Here is your AI-powered
            interview performance report.
          </p>

          {evaluation && (
            <div style={styles.resultCard}>

              <h2 style={styles.reportTitle}>
                📊 AI Interview Report
              </h2>

              <div style={styles.scoreCircle}>
                <span>
                  {evaluation.overallScore}
                </span>

                <small>/100</small>
              </div>


              <div style={styles.scoreGrid}>

                <ScoreBox
                  title="Technical"
                  score={
                    evaluation.technicalKnowledge
                  }
                />

                <ScoreBox
                  title="Communication"
                  score={
                    evaluation.communication
                  }
                />

                <ScoreBox
                  title="Confidence"
                  score={
                    evaluation.confidence
                  }
                />

                <ScoreBox
                  title="Problem Solving"
                  score={
                    evaluation.problemSolving
                  }
                />

              </div>


              <div style={styles.feedbackSection}>

                <h3>
                  ✅ Your Strengths
                </h3>

                <ul>
                  {evaluation.strengths?.map(
                    (item, index) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}
                </ul>

              </div>


              <div style={styles.feedbackSection}>

                <h3>
                  📈 Areas to Improve
                </h3>

                <ul>
                  {evaluation.improvements?.map(
                    (item, index) => (
                      <li key={index}>
                        {item}
                      </li>
                    )
                  )}
                </ul>

              </div>


              <div style={styles.finalFeedback}>

                <h3>
                  💬 AI Feedback
                </h3>

                <p>
                  {evaluation.finalFeedback}
                </p>

              </div>

            </div>
          )}

          <button
            style={styles.primaryButton}
            onClick={() => navigate("/")}
          >
            🏠 Back to Home
          </button>

        </div>
      </div>
    );
  }


  /*
  ========================================================
  MAIN INTERVIEW SCREEN
  ========================================================
  */

  const progress =
    ((currentIndex + 1) /
      questions.length) *
    100;


  return (
    <div style={styles.page}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>
          <div style={styles.logo}>
            🤖 PrepPilot <span>AI</span>
          </div>

          <h1 style={styles.title}>
            AI Mock Interview
          </h1>

          <p style={styles.subtitle}>
            Practice like a real interview.
            Speak naturally and get instant AI feedback.
          </p>
        </div>

        <div style={styles.questionNumber}>
          Question{" "}
          <strong>
            {currentIndex + 1}
          </strong>{" "}
          / {questions.length}
        </div>

      </div>


      {/* PROGRESS */}

      <div style={styles.progressContainer}>

        <div style={styles.progressBackground}>
          <div
            style={{
              ...styles.progressBar,
              width: `${progress}%`,
            }}
          />
        </div>

        <div style={styles.progressText}>
          {Math.round(progress)}% Complete
        </div>

      </div>


      {/* MAIN INTERVIEW */}

      <div style={styles.interviewLayout}>

        {/* LEFT */}

        <div style={styles.mainCard}>

          {/* INTERVIEWER */}

          <div style={styles.interviewer}>

            <div style={styles.avatar}>
              🤖
            </div>

            <div>
              <h3 style={styles.interviewerName}>
                PrepPilot AI
              </h3>

              <span style={styles.status}>

                {isSpeaking
                  ? "🔊 Speaking..."
                  : isListening
                  ? "🔴 Listening..."
                  : evaluating
                  ? "🧠 Evaluating..."
                  : "🟢 Interviewer Ready"}

              </span>
            </div>

          </div>


          {/* QUESTION */}

          <div style={styles.questionBox}>

            <div style={styles.questionLabel}>
              AI INTERVIEWER
            </div>

            <h2 style={styles.question}>
              {currentQuestion}
            </h2>

            <button
              style={styles.repeatButton}
              onClick={() =>
                speakQuestion(
                  currentQuestion
                )
              }
              disabled={
                isSpeaking ||
                evaluating
              }
            >
              🔊 Repeat Question
            </button>

          </div>


          {/* EVALUATION */}

          {questionEvaluation && (
            <div style={styles.evaluationBox}>

              <div style={styles.evaluationHeader}>

                <h3>
                  🤖 AI Feedback
                </h3>

                <div style={styles.answerScore}>
                  {questionEvaluation.score}/10
                </div>

              </div>


              <p>
                {questionEvaluation.feedback}
              </p>


              <div style={styles.feedbackColumns}>

                <div>
                  <strong>
                    ✅ Strengths
                  </strong>

                  <ul>
                    {questionEvaluation.strengths?.map(
                      (item, index) => (
                        <li key={index}>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>


                <div>
                  <strong>
                    📈 Improve
                  </strong>

                  <ul>
                    {questionEvaluation.improvements?.map(
                      (item, index) => (
                        <li key={index}>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>

              </div>

            </div>
          )}


          {/* ANSWER AREA */}

          {!questionEvaluation && (
            <div style={styles.answerArea}>

              <div style={styles.answerHeader}>

                <h3>
                  🎙️ Your Answer
                </h3>

                <span>
                  Speak or type
                </span>

              </div>


              <textarea
                value={answer}
                onChange={(event) =>
                  setAnswer(
                    event.target.value
                  )
                }
                placeholder="Start speaking or type your answer here..."
                style={styles.textarea}
                disabled={evaluating}
              />


              <div style={styles.controls}>

                {!isListening ? (

                  <button
                    style={styles.micButton}
                    onClick={startListening}
                    disabled={evaluating}
                  >
                    🎙️ Start Speaking
                  </button>

                ) : (

                  <button
                    style={styles.stopButton}
                    onClick={stopListening}
                  >
                    ⏹ Stop Listening
                  </button>

                )}


                <button
                  style={styles.submitButton}
                  onClick={submitAnswer}
                  disabled={
                    !answer.trim() ||
                    evaluating ||
                    isListening
                  }
                >
                  {evaluating
                    ? "🧠 AI Evaluating..."
                    : "🚀 Submit Answer"}
                </button>

              </div>


              {isListening && (
                <div style={styles.listening}>
                  🔴 Listening... Speak your answer.
                </div>
              )}

            </div>
          )}


          {/* NEXT */}

          {questionEvaluation && (
            <div style={styles.nextSection}>

              <button
                style={styles.nextButton}
                onClick={nextQuestion}
                disabled={finishing}
              >
                {currentIndex <
                questions.length - 1
                  ? "Next Question →"
                  : "Finish Interview →"}
              </button>

            </div>
          )}


          {/* BOTTOM */}

          <div style={styles.bottomActions}>

            <button
              style={styles.exitButton}
              onClick={() => {
                window.speechSynthesis?.cancel();

                stopListening();

                navigate("/");
              }}
            >
              ← Exit Interview
            </button>


            {conversation.length > 0 &&
              !questionEvaluation && (
                <button
                  style={styles.finishButton}
                  onClick={finishInterview}
                  disabled={finishing}
                >
                  {finishing
                    ? "Generating Report..."
                    : "📊 Finish Interview"}
                </button>
              )}

          </div>


          {/* ERROR */}

          {error && (
            <div style={styles.error}>
              ❌ {error}
            </div>
          )}

        </div>


        {/* RIGHT SIDEBAR */}

        <div style={styles.sidebar}>

          <div style={styles.sideCard}>

            <h3>
              🎯 Interview Progress
            </h3>

            <div style={styles.bigProgress}>
              {currentIndex + 1}
              <span>
                / {questions.length}
              </span>
            </div>

            <p>
              Questions completed
            </p>

          </div>


          <div style={styles.sideCard}>

            <h3>
              💡 Interview Tips
            </h3>

            <ul style={styles.tips}>

              <li>
                Speak clearly and confidently.
              </li>

              <li>
                Keep your answer structured.
              </li>

              <li>
                Use examples from your projects.
              </li>

              <li>
                Don't rush your answer.
              </li>

              <li>
                If you don't know something,
                explain what you do know.
              </li>

            </ul>

          </div>


          <div style={styles.sideCard}>

            <h3>
              🎤 Voice Interview
            </h3>

            <p>
              Click "Start Speaking" and answer
              naturally. Your speech will
              automatically appear in the answer box.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}


/*
========================================================
SCORE BOX
========================================================
*/

function ScoreBox({ title, score }) {
  return (
    <div style={styles.scoreBox}>

      <span>
        {title}
      </span>

      <strong>
        {score ?? 0}
      </strong>

      <small>
        /100
      </small>

    </div>
  );
}


/*
========================================================
STYLES
========================================================
*/

const styles = {

  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #eef2ff, #f8fafc)",
    padding: "35px",
    fontFamily:
      "Inter, Arial, sans-serif",
    color: "#172033",
  },

  header: {
    maxWidth: "1250px",
    margin: "0 auto 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
  },

  logo: {
    fontSize: "22px",
    fontWeight: "800",
    marginBottom: "18px",
  },

  title: {
    fontSize: "42px",
    margin: "0 0 8px",
    fontWeight: "800",
  },

  subtitle: {
    margin: 0,
    color: "#667085",
    fontSize: "16px",
  },

  questionNumber: {
    background: "#ffffff",
    padding: "14px 20px",
    borderRadius: "14px",
    boxShadow:
      "0 8px 30px rgba(0,0,0,0.07)",
    whiteSpace: "nowrap",
  },

  progressContainer: {
    maxWidth: "1250px",
    margin: "0 auto 25px",
  },

  progressBackground: {
    height: "8px",
    background: "#dfe4ea",
    borderRadius: "20px",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    background:
      "linear-gradient(90deg,#6366f1,#8b5cf6)",
    borderRadius: "20px",
    transition: "width 0.4s ease",
  },

  progressText: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#667085",
  },

  interviewLayout: {
    maxWidth: "1250px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) 300px",
    gap: "25px",
  },

  mainCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "30px",
    boxShadow:
      "0 15px 50px rgba(31,41,55,0.10)",
  },

  interviewer: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    paddingBottom: "22px",
    borderBottom:
      "1px solid #edf0f4",
  },

  avatar: {
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#6366f1,#8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
  },

  interviewerName: {
    margin: "0 0 5px",
    fontSize: "18px",
  },

  status: {
    color: "#667085",
    fontSize: "14px",
  },

  questionBox: {
    marginTop: "25px",
    padding: "35px",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg,#f7f7ff,#eef2ff)",
    border:
      "1px solid #e0e7ff",
  },

  questionLabel: {
    color: "#6366f1",
    fontWeight: "800",
    fontSize: "12px",
    letterSpacing: "1px",
    marginBottom: "14px",
  },

  question: {
    fontSize: "28px",
    lineHeight: "1.4",
    margin: "0 0 20px",
  },

  repeatButton: {
    border: "none",
    background: "#ffffff",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
  },

  answerArea: {
    marginTop: "25px",
    padding: "25px",
    background: "#f8fafc",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
  },

  answerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },

  textarea: {
    width: "100%",
    minHeight: "160px",
    boxSizing: "border-box",
    resize: "vertical",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid #d7dce3",
    fontSize: "16px",
    outline: "none",
    fontFamily: "inherit",
  },

  controls: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "15px",
  },

  micButton: {
    border: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "14px 20px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
  },

  stopButton: {
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    padding: "14px 20px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
  },

  submitButton: {
    border: "none",
    background:
      "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#ffffff",
    padding: "14px 22px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
  },

  listening: {
    marginTop: "14px",
    color: "#dc2626",
    fontWeight: "700",
  },

  evaluationBox: {
    marginTop: "25px",
    padding: "25px",
    borderRadius: "18px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
  },

  evaluationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  answerScore: {
    fontSize: "25px",
    fontWeight: "800",
  },

  feedbackColumns: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "25px",
    marginTop: "20px",
  },

  nextSection: {
    marginTop: "20px",
    textAlign: "right",
  },

  nextButton: {
    border: "none",
    background:
      "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#ffffff",
    padding: "15px 25px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "15px",
  },

  bottomActions: {
    marginTop: "25px",
    paddingTop: "20px",
    borderTop:
      "1px solid #edf0f4",
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
  },

  exitButton: {
    border: "none",
    background: "#f1f5f9",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  finishButton: {
    border: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  error: {
    marginTop: "20px",
    padding: "14px",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "12px",
  },

  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  sideCard: {
    background: "#ffffff",
    padding: "23px",
    borderRadius: "20px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.07)",
  },

  bigProgress: {
    fontSize: "42px",
    fontWeight: "800",
    marginTop: "15px",
  },

  tips: {
    paddingLeft: "20px",
    lineHeight: "1.8",
    color: "#667085",
  },

  resultContainer: {
    maxWidth: "850px",
    margin: "40px auto",
    textAlign: "center",
  },

  resultEmoji: {
    fontSize: "60px",
  },

  resultTitle: {
    fontSize: "40px",
    margin: "10px 0",
  },

  resultSubtitle: {
    color: "#667085",
    fontSize: "17px",
  },

  resultCard: {
    marginTop: "30px",
    background: "#ffffff",
    padding: "35px",
    borderRadius: "24px",
    textAlign: "left",
    boxShadow:
      "0 15px 50px rgba(0,0,0,0.10)",
  },

  reportTitle: {
    textAlign: "center",
  },

  scoreCircle: {
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#ffffff",
    margin: "25px auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },

  scoreGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4,1fr)",
    gap: "15px",
  },

  scoreBox: {
    background: "#f8fafc",
    padding: "18px",
    borderRadius: "14px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  feedbackSection: {
    marginTop: "25px",
  },

  finalFeedback: {
    marginTop: "25px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "15px",
  },

  primaryButton: {
    border: "none",
    background:
      "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#ffffff",
    padding: "14px 25px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
  },

  emptyPage: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8fafc",
    padding: "20px",
  },

  emptyCard: {
    background: "#ffffff",
    padding: "50px",
    borderRadius: "25px",
    textAlign: "center",
    maxWidth: "500px",
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.08)",
  },

  bigEmoji: {
    fontSize: "60px",
  },

};

export default MockInterview;