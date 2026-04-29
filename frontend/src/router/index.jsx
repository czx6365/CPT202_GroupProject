import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../shared/AppShell";
import Homepage from "../pages/public/Home/Homepage";
import Discovery from "../pages/public/Discovery/Discovery";
import ResourceDetail from "../pages/public/ResourceDetail/ResourceDetail";
import Login from "../pages/user/Auth/Login";
import Register from "../pages/user/Auth/Register";
import Profile from "../pages/user/Profile/Profile";
import Dashboard from "../pages/contributor/Dashboard/Dashboard";
import ContributorExplore from "../pages/contributor/Explore/Explore";
import Submit from "../pages/contributor/Submit/Submit";
import Resubmit from "../pages/contributor/Resubmit/Resubmit";
import Drafts from "../pages/contributor/Drafts/Drafts";
import Submissions from "../pages/contributor/Submissions/Submissions";
import ContributorProfile from "../pages/contributor/Profile/Profile";
import AdminDashboard from "../pages/admin/Dashboard/AdminDashboard";
import ReviewList from "../pages/admin/Review/ReviewList";
import ReviewDetail from "../pages/admin/Review/ReviewDetail";
import UserApproval from "../pages/admin/Users/UserApproval";
import Categories from "../pages/admin/MasterData/Categories";
import Tags from "../pages/admin/MasterData/Tags";
import Archive from "../pages/admin/Archive/Archive";
import AuditLogs from "../pages/admin/Archive/AuditLogs";
import Announcements from "../pages/admin/Announcement/Announcements";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/resource/:id" element={<ResourceDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/contributor" element={<Dashboard />} />
          <Route path="/contributor/explore" element={<ContributorExplore />} />
          <Route path="/contributor/profile" element={<ContributorProfile />} />
          <Route path="/contributor/createdraft" element={<Submit />} />
          <Route path="/contributor/createdraft/:id" element={<Submit />} />
          <Route path="/contributor/drafts" element={<Drafts />} />
          <Route path="/contributor/submissions" element={<Submissions />} />
          <Route path="/contributor/submissions/:id" element={<Submissions />} />
          <Route path="/contributor/resubmit/:id" element={<Resubmit />} />
          <Route path="/dashboard" element={<Navigate to="/contributor" replace />} />
          <Route path="/submit" element={<Navigate to="/contributor/createdraft" replace />} />
          <Route path="/drafts" element={<Navigate to="/contributor/drafts" replace />} />
          <Route path="/resubmit/:id" element={<Navigate to="/contributor/submissions" replace />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/admin/review" element={<ReviewList />} />
          <Route path="/admin/review/:id" element={<ReviewDetail />} />
          <Route path="/admin/users" element={<UserApproval />} />
          <Route path="/admin/master-data/categories" element={<Categories />} />
          <Route path="/admin/master-data/tags" element={<Tags />} />
          <Route path="/admin/audit" element={<AuditLogs />} />
          <Route path="/admin/archive" element={<Archive />} />
          <Route path="/admin/announcements" element={<Announcements />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
