import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import GoalPage from './pages/GoalPage';
import ResultPage from './pages/ResultPage';
import DiaryPage from './pages/DiaryPage';
import SurveyPage from './pages/SurveyPage';
import TutorialPage from './pages/TutorialPage';
import MainLayout from './components/layout/MainLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-lg">
          <Routes>
            {/* 탭바가 있는 메인 페이지들 */}
            <Route
              path="/"
              element={
                <MainLayout>
                  <HomePage />
                </MainLayout>
              }
            />
            <Route
              path="/diary"
              element={
                <MainLayout>
                  <DiaryPage />
                </MainLayout>
              }
            />

            {/* 풀스크린 페이지들 (탭바 없음) */}
            <Route path="/tutorial" element={<TutorialPage />} />
            <Route path="/goal" element={<GoalPage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/survey" element={<SurveyPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
