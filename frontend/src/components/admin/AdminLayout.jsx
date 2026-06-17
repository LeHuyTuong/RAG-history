const AdminLayout = ({ children, className = '' }) => {
  return (
    <div className={`flex-grow flex flex-col min-h-screen bg-surface ${className}`}>
      <main className="p-8 max-w-[1600px] mx-auto w-full space-y-8 font-body animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;