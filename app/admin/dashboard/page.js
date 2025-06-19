// app/admin/dashboard/page.js
'use client';

const AdminDashboardPage = () => {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Welcome!</h2>
          <p className="text-gray-600 text-sm sm:text-base">This is your main admin control panel. More features coming soon!</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Quick Stats</h2>
          <p className="text-gray-600 text-sm sm:text-base">Total Sales: Rs.0.00</p>
          <p className="text-gray-600 text-sm sm:text-base">New Orders: 0</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Recent Activity</h2>
          <p className="text-gray-600 text-sm sm:text-base">No recent activity.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;