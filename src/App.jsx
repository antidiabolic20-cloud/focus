import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import Home from './pages/Home';
import ForumList from './pages/Forum/ForumList';
import CreatePost from './pages/Forum/CreatePost';
import ThreadView from './pages/Forum/ThreadView';
import TestList from './pages/MockTests/TestList';
import Profile from './pages/Profile';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Home />} />
            <Route path="forums" element={<ForumList />} />
            <Route path="forums/create" element={<CreatePost />} />
            <Route path="forums/:id" element={<ThreadView />} />
            <Route path="tests" element={<TestList />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
