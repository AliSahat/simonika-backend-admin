import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import Loading from "@/components/Loading";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get token from localStorage or your auth context
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error(
            "Token tidak ditemukan. Silakan login terlebih dahulu.",
          );
        }

        const response = await axios.get("/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfile(response.data.user);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Terjadi kesalahan saat mengambil data profil",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-[150px] pt-5 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Profil Pengguna
          </h1>

          {loading && <Loading />}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-red-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-800">Error</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && profile && (
            <div className="bg-white rounded-3xl border border-black/15 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-32"></div>
              <div className="px-8 pb-8">
                <div className="relative -mt-16 mb-6">
                  <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                    <span className="text-5xl font-bold text-blue-600">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Nama Lengkap
                    </label>
                    <p className="text-xl font-semibold text-gray-800">
                      {profile.name}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Username
                    </label>
                    <p className="text-lg text-gray-800">@{profile.username}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        User ID
                      </label>
                      <p className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded">
                        {profile.id}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Bergabung Sejak
                      </label>
                      <p className="text-sm text-gray-700">
                        {formatDate(profile.createdAt)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Terakhir Diperbarui
                      </label>
                      <p className="text-sm text-gray-700">
                        {formatDate(profile.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/*<div className="pt-6 border-t border-gray-200">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Edit Profil
                    </button>
                  </div>*/}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
