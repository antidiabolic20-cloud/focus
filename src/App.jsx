import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import Home from './pages/Home';
import ForumList from './pages/Forum/ForumList';
import CreatePost from './pages/Forum/CreatePost';
import ThreadView from './pages/Forum/ThreadView';
import TestList from './pages/MockTests/TestList';
import TakeTest from './pages/MockTests/TakeTest';
import TestResult from './pages/MockTests/TestResult';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import GroupList from './pages/Groups/GroupList';
import GroupDetail from './pages/Groups/GroupDetail';
import Messages from './pages/Messages/Messages';
import Community from './pages/Community';
import Resources from './pages/Resources';
import FocusDojo from './pages/FocusDojo';
import StudyBuddy from './pages/StudyBuddy';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Analytics from './pages/Analytics';
import BattleLobby from './pages/Battle/BattleLobby';
import BattleArena from './pages/Battle/BattleArena';
import Shop from './pages/Shop';

import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Home />} />
                <Route path="forums" element={<ForumList />} />
                <Route path="forums/create" element={<CreatePost />} />
                <Route path="forums/:id" element={<ThreadView />} />
                <Route path="groups" element={<GroupList />} />
                <Route path="groups/:id" element={<GroupDetail />} />
                <Route path="community" element={<Community />} />
                <Route path="resources" element={<Resources />} />
                <Route path="focus" element={<FocusDojo />} />
                <Route path="study-buddy" element={<StudyBuddy />} />
                <Route path="messages" element={<Messages />} />
                <Route path="tests" element={<TestList />} />
                <Route path="tests/:id" element={<TakeTest />} />
                <Route path="results/:id" element={<TestResult />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="battle" element={<BattleLobby />} />
                <Route path="battle/:id" element={<BattleArena />} />
                <Route path="shop" element={<Shop />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/:id" element={<Profile />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
