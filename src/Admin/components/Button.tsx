import React from "react";

const Dashboard = ({ onLogout }: any) => {
  const name = localStorage.getItem("name");
  const role = localStorage.getItem("role");

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR */}
      <div className="w-64 bg-white shadow-xl p-6 flex flex-col justify-between">

        <div>
          <h1 className="text-2xl font-bold text-blue-600 mb-10">
            NexusHR
          </h1>

          <ul className="space-y-5 text-gray-600 font-medium">
            <li className="hover:text-blue-600 cursor-pointer">Dashboard</li>
            <li className="hover:text-blue-600 cursor-pointer">Manage Leaves</li>
            <li className="hover:text-blue-600 cursor-pointer">My Team</li>
            <li className="hover:text-blue-600 cursor-pointer">Reports</li>
          </ul>
        </div>

        <button
          onClick={onLogout}
          className="bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 flex justify-between items-center shadow">

          <h2 className="text-xl font-semibold">Dashboard</h2>

          <div className="text-sm">
            {name} ({role})
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8 grid grid-cols-3 gap-6">

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition">
            <h3 className="text-lg font-semibold mb-2">Manage Leaves</h3>
            <p className="text-gray-500 text-sm">
              Apply and track leaves
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition">
            <h3 className="text-lg font-semibold mb-2">My Team</h3>
            <p className="text-gray-500 text-sm">
              View team members
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition">
            <h3 className="text-lg font-semibold mb-2">Reports</h3>
            <p className="text-gray-500 text-sm">
              Check reports
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;