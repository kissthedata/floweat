import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import GoalPage from './pages/GoalPage';
import ResultPage from './pages/ResultPage';
import DiaryPage from './pages/DiaryPage';
import SurveyPage from './pages/SurveyPage';
import TutorialPage from './pages/TutorialPage';
import MainLayout from './components/layout/MainLayout';
import { checkTutorialCompleted } from './services/userPreferencesService';

function AppRoutes() {
  const location = useLocation();
  const { loading: authLoading } = useAuth();
  const [tutorialCompleted, setTutorialCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkTutorial() {
      console.log('[App] Checking tutorial completion...');
      console.log('[App] location.state:', location.state);
      console.log('[App] location.pathname:', location.pathname);

      // location.state로 전달된 완료 상태 먼저 확인
      if (location.state && (location.state as { tutorialCompleted?: boolean }).tutorialCompleted) {
        console.log('[App] Tutorial completed via location.state');
        setTutorialCompleted(true);
        return;
      }

      const completed = await checkTutorialCompleted();
      console.log('[App] Tutorial completed from sessionStorage:', completed);
      setTutorialCompleted(completed);
    }

    if (!authLoading) {
      checkTutorial();
    }
  }, [authLoading, location.pathname]); // location.state 제거로 무한 루프 방지

  // 로딩 중일 때
  if (authLoading || tutorialCompleted === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 튜토리얼을 완료하지 않았고, 튜토리얼 페이지가 아닌 경우 튜토리얼로 리다이렉트
  if (!tutorialCompleted && location.pathname !== '/tutorial') {
    return <Navigate to="/tutorial" replace />;
  }

  return (
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
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-lg">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
