import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- LAYOUTS ---
import AdminLayout from './components/AdminLayout';
import UserLayout from './components/UserLayout';

// --- TRANG AUTH (ĐĂNG NHẬP/ĐĂNG KÝ) ---
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// --- NHÓM TRANG NGƯỜI DÙNG (USER) ---
import Home from './pages/user/home/Home';
import UserPeriods from './pages/user/periods/UserPeriods';
import PeriodDetail from './pages/user/periods/PeriodDetail';
import UserEvents from './pages/user/events/UserEvents';
import EventDetail from './pages/user/events/EventDetail';
import UserCharacters from './pages/user/characters/UserCharacters';
import CharacterDetail from './pages/user/characters/CharacterDetail';
import UserLocations from './pages/user/locations/UserLocations';
import UserRecords from './pages/user/records/UserRecords';
import RecordDetail from './pages/user/records/RecordDetail';
import AIChat from './pages/user/ai/AIChat';
import ArticleDetail from './pages/user/articles/ArticleDetail';
import UserPosts from './pages/user/articles/UserPosts'; 
import LocationDetail from './pages/user/locations/LocationDetail';
import HistoricalMap from './pages/user/locations/HistoricalMap';
import UserProfile from './pages/user/profile/UserProfile';

// --- NHÓM TRANG QUẢN TRỊ (ADMIN) ---
// Dashboard
import AdminDashboard from './pages/admin/dashboard/AdminDashboard';

// Articles (Bài viết)
import ArticleManagement from './pages/admin/articles/ArticleManagement';
import ArticleForm from './pages/admin/articles/ArticleForm';

// Events (Sự kiện)
import EventManagement from './pages/admin/events/EventManagement';
import EventForm from './pages/admin/events/EventForm';

// Characters (Nhân vật)
import CharacterManagement from './pages/admin/characters/CharacterManagement';
import CharacterForm from './pages/admin/characters/CharacterForm';

// Locations (Địa danh)
import LocationManagement from './pages/admin/locations/LocationManagement';
import LocationForm from './pages/admin/locations/LocationForm';

// Records (Sử liệu)
import RecordManagement from './pages/admin/records/RecordManagement';
import RecordForm from './pages/admin/records/RecordForm';

// Metadata (Siêu dữ liệu)
import MetadataManagement from './pages/admin/metadata/MetadataManagement';
import MetadataTagForm from './pages/admin/metadata/MetadataTagForm';
import MetadataCategoryForm from './pages/admin/metadata/MetadataCategoryForm'; 
import MetadataPeriodForm from './pages/admin/metadata/MetadataPeriodForm';

// Hub (Mối quan hệ)
import KnowledgeGraph from './pages/admin/hub/KnowledgeGraph';
import HubEntityForm from './pages/admin/hub/HubEntityForm';

// Members (Thành viên)
import MemberManagement from './pages/admin/members/MemberManagement';
import MemberForm from './pages/admin/members/MemberForm';

// Settings & AI
import SystemSettings from './pages/admin/settings/SystemSettings';
// import AiManagement from './pages/admin/ai/AiManagement'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. Tuyến đường công khai không cần Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 2. Hệ thống Giao diện Người dùng (User Site) */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="posts" element={<UserPosts />} /> 
          <Route path="articles/:slug" element={<ArticleDetail />} />
          <Route path="periods" element={<UserPeriods />} />
          <Route path="periods/:id" element={<PeriodDetail />} />
          <Route path="events" element={<UserEvents />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route path="characters" element={<UserCharacters />} />
          <Route path="characters/:id" element={<CharacterDetail />} />
          <Route path="locations" element={<UserLocations />} />
          <Route path="records" element={<UserRecords />} />
          <Route path="records/:id" element={<RecordDetail />} />
          <Route path="ai-chat" element={<AIChat />} />
          <Route path="locations/:id" element={<LocationDetail />} />
          <Route path="map" element={<HistoricalMap />} /> 
          <Route path="profile" element={<UserProfile />} />

        </Route>

        {/* 3. Hệ thống Quản trị (Admin CMS) */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* Dashboard chính */}
          <Route index element={<AdminDashboard />} /> 
          
          {/* Quản lý Bài viết */}
          <Route path="articles" element={<ArticleManagement />} /> 
          <Route path="articles/new" element={<ArticleForm />} />
          <Route path="articles/edit/:id" element={<ArticleForm />} />

          {/* Quản lý Sự kiện */}
          <Route path="events" element={<EventManagement />} />
          <Route path="events/new" element={<EventForm />} />
          <Route path="events/edit/:id" element={<EventForm />} />
          
          {/* Quản lý Nhân vật */}
          <Route path="characters" element={<CharacterManagement />} />
          <Route path="characters/new" element={<CharacterForm />} />
          <Route path="characters/edit/:id" element={<CharacterForm />} />

          {/* Quản lý Địa danh */}
          <Route path="locations" element={<LocationManagement />} />
          <Route path="locations/new" element={<LocationForm />} />
          <Route path="locations/edit/:id" element={<LocationForm />} />

          {/* Quản lý Sử liệu */}
          <Route path="records" element={<RecordManagement />} />
          <Route path="records/new" element={<RecordForm />} />
          <Route path="records/edit/:id" element={<RecordForm />} />

          {/* Quản lý Siêu dữ liệu */}
          <Route path="metadata" element={<MetadataManagement />} />
          <Route path="metadata/tags/new" element={<MetadataTagForm />} />
          <Route path="metadata/tags/edit/:id" element={<MetadataTagForm />} />
          <Route path="metadata/categories/new" element={<MetadataCategoryForm />} />
          <Route path="metadata/categories/edit/:id" element={<MetadataCategoryForm />} />
          <Route path="metadata/periods/new" element={<MetadataPeriodForm />} />
          <Route path="metadata/periods/edit/:id" element={<MetadataPeriodForm />} />

          {/* Quản lý Mối quan hệ (Hub) */}
          <Route path="hub" element={<KnowledgeGraph />} />
          <Route path="hub/edit/:id" element={<HubEntityForm />} />

          {/* Quản lý Thành viên */}
          <Route path="members" element={<MemberManagement />} />
          <Route path="members/new" element={<MemberForm />} />
          <Route path="members/edit/:id" element={<MemberForm />} />

          {/* Cài đặt hệ thống */}
          <Route path="settings" element={<SystemSettings />} />
          
          {/* <Route path="ai" element={<AiManagement />} /> */}
        </Route>

        {/* 4. Mặc định: Quay về trang chủ nếu gõ sai Link */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;