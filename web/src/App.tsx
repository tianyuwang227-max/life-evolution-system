import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Review = lazy(() => import("./pages/Review"));
const Prompts = lazy(() => import("./pages/Prompts"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Punishments = lazy(() => import("./pages/Punishments"));
const Finance = lazy(() => import("./pages/Finance"));
const Settings = lazy(() => import("./pages/Settings"));
const Health = lazy(() => import("./pages/Health"));
const Exercise = lazy(() => import("./pages/Exercise"));

const Loading = () => (
  <div className="page">
    <div className="card">加载中...</div>
  </div>
);

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-shell">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/review" element={<Review />} />
            <Route path="/prompts" element={<Prompts />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/punishments" element={<Punishments />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/exercise" element={<Exercise />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/health" element={<Health />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
