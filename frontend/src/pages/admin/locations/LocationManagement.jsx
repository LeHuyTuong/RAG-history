import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LocationManagement = () => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, name: '', id: null });

  const locations = [
    { id: 'LOC-1001', name: 'Ải Chi Lăng', type: 'Chiến trường', coords: '21.62, 106.67', dynasties: ['Nhà Lê', 'Nhà Trần'] },
    { id: 'LOC-1024', name: 'Hoàng Thành Thăng Long', type: 'Cố đô', coords: '21.03, 105.83', dynasties: ['Lý', 'Trần', 'Lê', 'Nguyễn'] },
    { id: 'LOC-1056', name: 'Cố đô Hoa Lư', type: 'Cố đô', coords: '20.28, 105.91', dynasties: ['Nhà Đinh', 'Tiền Lê'] },
    { id: 'LOC-1102', name: 'Bạch Đằng Giang', type: 'Chiến trường', coords: '20.85, 106.66', dynasties: ['Nhà Ngô', 'Nhà Trần'] },
  ];

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-surface">


      <main className="p-8 max-w-[1600px] mx-auto w-full space-y-8 font-body">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
  <div>
    <h2 className="font-headline text-3xl text-primary font-bold">
      Quản lý Địa danh Lịch sử
    </h2>

    <p className="font-body text-sm text-on-surface-variant mt-1 italic">
      Quản lý và hiệu đính các địa danh, di tích và chiến trường lịch sử.
    </p>
  </div>

  <button
    onClick={() => navigate('/admin/locations/new')}
    className="bg-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 active:scale-95 shadow-md font-headline font-bold uppercase text-sm"
  >
    <span className="material-symbols-outlined">add_location</span>
    Thêm địa danh mới
  </button>
</div>
        {/* 2. SUMMARY STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Tổng địa danh" value="850" icon="map" />
          <StatCard title="Đã xác định tọa độ" value="720" icon="location_on" />
          <StatCard title="Di tích quốc gia" value="124" icon="fort" />
        </div>

        {/* 3. MAIN CONTENT LAYOUT */}
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: BẢNG DỮ LIỆU */}
          <div className="col-span-12 lg:col-span-9 bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
             <div className="p-4 bg-surface-low border-b border-outline-variant flex gap-4">
                <select className="bg-white border border-outline-variant rounded px-3 py-1.5 text-xs outline-none"><option>Tất cả loại hình</option><option>Thành quách</option></select>
                <select className="bg-white border border-outline-variant rounded px-3 py-1.5 text-xs outline-none"><option>Tất cả triều đại</option></select>
             </div>
             <table className="w-full text-left border-collapse">
                <thead className="bg-surface-variant/30 font-body text-[10px] uppercase tracking-widest border-b border-outline-variant text-on-surface-variant">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Địa danh</th>
                    <th className="p-4">Loại hình</th>
                    <th className="p-4">Tọa độ</th>
                    <th className="p-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm">
                  {locations.map((loc, idx) => (
                    <tr key={loc.id} className={`${idx % 2 !== 0 ? 'bg-surface-low/30' : ''} hover:bg-surface-variant/20 transition-colors group`}>
                      <td className="p-4 font-body text-xs text-primary">{loc.id}</td>
                      <td className="p-4 font-bold text-on-surface font-headline">{loc.name}</td>
                      <td className="p-4 text-xs">
                        <span className="bg-surface-variant px-2 py-0.5 rounded text-[10px]">{loc.type}</span>
                      </td>
                      <td className="p-4 font-body text-[11px] opacity-60">{loc.coords}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => navigate(`/admin/locations/edit/${loc.id}`)} className="p-2 hover:text-primary"><span className="material-symbols-outlined text-sm">edit</span></button>
                          <button onClick={() => setDeleteModal({ open: true, name: loc.name, id: loc.id })} className="p-2 hover:text-red-600"><span className="material-symbols-outlined text-sm">delete</span></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>

          {/* CỘT PHẢI: MAP PREVIEW */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
             <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-md">
                <div className="p-3 bg-surface-low border-b border-outline-variant flex justify-between items-center">
                  <span className="font-body text-[10px] font-bold uppercase tracking-widest text-primary">Bản đồ Di tích</span>
                  <span className="material-symbols-outlined text-sm text-primary">explore</span>
                </div>
                <div className="aspect-square bg-slate-200 relative group overflow-hidden">
                   <img className="w-full h-full object-cover grayscale opacity-70 group-hover:scale-110 transition-transform duration-[10s]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGAMfJYW7Pnb6CKqQ7tCg6vlUaD7Cb76P1T0_SrKAVbymeCS6685PMZ6wJZG8LIoeE0J1jq7SIqQwtRpRzY94VFUS_ASrUPdycW1-Rc-mQQ1_jXi1Wci5WrHn6ZI55WUyzxOr4uuNjcP1bss7YHtYDJNXvZDOPBzxSwbAJodSrM8U8LvLM108AcXepkjukg9LD47RytTSzF1DhEJ-ap2nGsxUMwk1tB7Y4h6TBG8TAVyodoAkbTqctDricTEXy7ENUZJN6LcpwVSI" alt="map" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                   <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur p-2 rounded text-[9px] font-bold border border-outline-variant uppercase">Lạng Sơn: Chi Lăng</div>
                </div>
                <div className="p-4">
                  <p className="text-xs italic text-on-surface-variant leading-relaxed">"Nơi ghi dấu những chiến công hiển hách của dân tộc trước quân xâm lược."</p>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* 4. DELETE MODAL */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModal({ open: false })}></div>
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl border-t-4 border-red-600 p-10 text-center animate-in fade-in zoom-in duration-300">
             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                <span className="material-symbols-outlined text-4xl">delete_forever</span>
             </div>
             <h3 className="font-headline text-2xl text-on-surface font-bold mb-2 uppercase">Xác nhận xóa?</h3>
             <p className="font-body text-sm text-on-surface-variant mb-10">Bạn chắc chắn muốn xóa địa danh <br/><strong className="text-primary italic">"{deleteModal.name}"</strong>? <br/>Dữ liệu này không thể khôi phục.</p>
             <div className="flex gap-4 font-body text-[11px] font-bold tracking-widest">
                <button onClick={() => setDeleteModal({ open: false })} className="flex-1 py-3 border border-outline rounded-lg hover:bg-surface-low transition-all">HỦY BỎ</button>
                <button className="flex-1 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-all">XÓA NGAY</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white border border-outline-variant p-6 rounded-xl flex items-center justify-between shadow-sm hover:-translate-y-1 transition-all">
    <div>
      <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-widest">{title}</p>
      <h3 className="font-headline text-3xl text-primary font-bold mt-1">{value}</h3>
    </div>
    <span className="material-symbols-outlined text-primary-container opacity-20 text-4xl">{icon}</span>
  </div>
);

export default LocationManagement;