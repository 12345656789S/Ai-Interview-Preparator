import { useLocation, useNavigate } from "react-router-dom";

function QuestionsPage() {

  const location = useLocation();
  const navigate = useNavigate();

  const questions = location.state?.questions || [];
  const resumeId = location.state?.resumeId;

  const handleMockInterview = () => {

    navigate("/mock-interview", {
      state: {
        questions: questions,
        resumeId: resumeId
      }
    });

  };

  return (
    <div className="questions-page">

      <div className="questions-page-header">

        <h1>
          🧠 Your Personalized Interview Questions
        </h1>

        <p>
          These questions are generated based on your resume.
        </p>

      </div>


      <div className="questions-list">

        {questions.map((question, index) => (

          <div
            className="question-card"
            key={index}
          >

            <strong>
              Q{index + 1}.
            </strong>

            <span>
              {question}
            </span>

          </div>

        ))}

      </div>


      <div className="questions-page-actions">

        <button
          className="primary-btn"
          onClick={handleMockInterview}
        >
          🎤 Start AI Mock Interview
        </button>

        <button
          className="secondary-btn"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

      </div>

    </div>
  );
}

export default QuestionsPage;