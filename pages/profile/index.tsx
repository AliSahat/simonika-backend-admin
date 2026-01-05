import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import Loading from '@/components/Loading';
import { useState as useStateCallback } from 'react';

interface Profile {
  id: string;
  name: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

const ProfilePage = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
      }

      const response = await axios.get('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle new API response format
      if (response.data.success && response.data.data?.user) {
        setProfile(response.data.data.user);
      } else if (response.data.user) {
        setProfile(response.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan saat mengambil data profil');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="pl-[150px] pt-5 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Profil Pengguna</h1>
              <p className="text-gray-600">Kelola informasi akun Anda</p>
            </div>
            {!loading && !error && profile && (
              <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profily
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading && <Loading />}

          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">Terjadi Kesalahan</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                  <button onClick={fetchProfile} className="mt-3 text-sm font-medium text-red-600 hover:text-red-800 underline">
                    Coba Lagi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Content */}
          {!loading && !error && profile && (
            <div className="space-y-6">
              {/* Main Profile Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Gradient Banner */}
                <div className="h-40 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
                      <path d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z" fill="currentColor" />
                    </svg>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="px-8 pb-8">
                  {/* Avatar */}
                  <div className="flex items-end gap-6 -mt-20 mb-8 relative z-10">
                    <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 border-4 border-white shadow-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-6xl font-bold text-white">{getInitials(profile.name)}</span>
                    </div>
                    <div className="pb-4">
                      <h2 className="text-3xl font-bold text-gray-900">{profile.name}</h2>
                      <p className="text-lg text-blue-600 font-medium">@{profile.username}</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-8" />

                  {/* Profile Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* User ID */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        User ID
                      </label>
                      <p className="text-sm text-gray-700 font-mono bg-white p-3 rounded-lg border border-gray-200 truncate">{profile.id}</p>
                    </div>

                    {/* Bergabung Sejak */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <label className="flex items-center gap-2 text-sm font-medium text-green-700 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Bergabung Sejak
                      </label>
                      <p className="text-sm font-semibold text-green-900">{formatDate(profile.createdAt)}</p>
                    </div>

                    {/* Terakhir Diperbarui */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <label className="flex items-center gap-2 text-sm font-medium text-purple-700 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Terakhir Diperbarui
                      </label>
                      <p className="text-sm font-semibold text-purple-900">{formatDate(profile.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Actions Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Aksi Cepat</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-3 px-6 py-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-blue-600 font-medium transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.172 4.172a4 4 0 015.656 0l2.828 2.828a4 4 0 010 5.656l-7.07 7.07a1 1 0 01-1.414-1.414l7.07-7.07a2 2 0 000-2.828l-2.828-2.828a2 2 0 00-2.828 0L9.172 9m0 0a4 4 0 115.656 5.656l-7.07 7.07"
                      />
                    </svg>
                    Ubah Password
                  </button>
                  <button className="flex items-center justify-center gap-3 px-6 py-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-indigo-600 font-medium transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C9.539 12.053 11.217 11 13 11c1.784 0 3.462 1.053 4.316 2.342m0 0h5.364a2 2 0 012 2v1.892a2 2 0 01-2 2H3a2 2 0 01-2-2v-1.892a2 2 0 012-2h5.364m0 0a6.968 6.968 0 010-1.364m0 1.364a6.968 6.968 0 010-1.364m15.978 3.364a6.968 6.968 0 01-1.042 2.635A2 2 0 0119 21H5a2 2 0 01-2-2v-1"
                      />
                    </svg>
                    Perbarui Avatar
                  </button>
                  <button className="flex items-center justify-center gap-3 px-6 py-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl text-green-600 font-medium transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Aktivitas Akun
                  </button>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-3 px-6 py-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 font-medium transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
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
