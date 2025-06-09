// app/admin/dashboard/page.js
'use client';

const AdminDashboardPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Welcome!</h2>
          <p className="text-gray-600">This is your main admin control panel. More features coming soon!</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Quick Stats (Placeholder)</h2>
          <p className="text-gray-600">Total Sales: $0.00</p>
          <p className="text-gray-600">New Orders: 0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Recent Activity (Placeholder)</h2>
          <p className="text-gray-600">No recent activity.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;