'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Parse JWT token to get user info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
      
      // Check if user is admin
      if (payload.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Mock data for demo purposes
      const mockUsers = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'admin',
          status: 'active',
          lastActive: '2024-12-30T10:30:00Z',
          teams: ['Development Team', 'QA Team'],
          projects: 5,
          joinDate: '2024-01-15T00:00:00Z',
          avatar: 'JD'
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          role: 'user',
          status: 'active',
          lastActive: '2024-12-30T09:15:00Z',
          teams: ['Development Team'],
          projects: 3,
          joinDate: '2024-01-20T00:00:00Z',
          avatar: 'JS'
        },
        {
          id: 3,
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          role: 'user',
          status: 'active',
          lastActive: '2024-12-30T08:45:00Z',
          teams: ['Development Team', 'Marketing Team'],
          projects: 7,
          joinDate: '2024-01-18T00:00:00Z',
          avatar: 'MJ'
        },
        {
          id: 4,
          name: 'Sarah Wilson',
          email: 'sarah.wilson@example.com',
          role: 'user',
          status: 'inactive',
          lastActive: '2024-12-25T14:20:00Z',
          teams: ['QA Team'],
          projects: 2,
          joinDate: '2024-01-22T00:00:00Z',
          avatar: 'SW'
        },
        {
          id: 5,
          name: 'Tom Brown',
          email: 'tom.brown@example.com',
          role: 'user',
          status: 'active',
          lastActive: '2024-12-30T11:00:00Z',
          teams: ['QA Team', 'Design Team'],
          projects: 4,
          joinDate: '2024-01-25T00:00:00Z',
          avatar: 'TB'
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const handleToggleUserStatus = (userId) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 bg-opacity-20 text-green-300 border border-green-500 border-opacity-30">
        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></div>
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500 bg-opacity-20 text-gray-300 border border-gray-500 border-opacity-30">
        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1"></div>
        Inactive
      </span>
    );
  };

  const getRoleBadge = (role) => {
    return role === 'admin' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500 bg-opacity-20 text-purple-300 border border-purple-500 border-opacity-30">
        👑 Admin
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 bg-opacity-20 text-blue-300 border border-blue-500 border-opacity-30">
        👤 User
      </span>
    );
  };

  const formatLastActive = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="glass-morphism p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-opacity-80">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-12">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{animationDelay: '3s'}}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
              <p className="text-white text-opacity-80">Manage user accounts and permissions</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
              <span className="text-yellow-300 text-sm">👑 Admin Access</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="glass-morphism p-6 mb-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="relative flex-1 max-w-lg">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 w-full"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="user">Users</option>
                </select>
                
                <span className="text-white text-opacity-60 text-sm whitespace-nowrap">
                  {filteredUsers.length} of {users.length} users
                </span>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="glass-morphism overflow-hidden animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white border-opacity-10">
                    <th className="px-6 py-4 text-left text-xs font-medium text-white text-opacity-60 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white text-opacity-60 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white text-opacity-60 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white text-opacity-60 uppercase tracking-wider">
                      Teams
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white text-opacity-60 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-white text-opacity-60 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white divide-opacity-5">
                  {filteredUsers.map((userData, index) => (
                    <tr 
                      key={userData.id} 
                      className="hover:bg-white hover:bg-opacity-5 transition-colors cursor-pointer animate-fade-in"
                      style={{animationDelay: `${0.3 + index * 0.05}s`}}
                      onClick={() => setSelectedUser(userData)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-sm font-medium text-white mr-4">
                            {userData.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{userData.name}</div>
                            <div className="text-sm text-white text-opacity-60">{userData.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(userData.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(userData.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {userData.teams.slice(0, 2).map((team, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-500 bg-opacity-20 text-blue-300">
                              {team}
                            </span>
                          ))}
                          {userData.teams.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-500 bg-opacity-20 text-gray-300">
                              +{userData.teams.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-opacity-60">
                        {formatLastActive(userData.lastActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleUserStatus(userData.id);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              userData.status === 'active' 
                                ? 'text-yellow-400 hover:bg-yellow-500 hover:bg-opacity-20' 
                                : 'text-green-400 hover:bg-green-500 hover:bg-opacity-20'
                            }`}
                            title={userData.status === 'active' ? 'Deactivate User' : 'Activate User'}
                          >
                            {userData.status === 'active' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(userData.id);
                            }}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500 hover:bg-opacity-20 transition-colors"
                            title="Delete User"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No users found</h3>
                <p className="text-white text-opacity-60">
                  {searchTerm || filterRole !== 'all' ? 'Try adjusting your search or filter criteria' : 'No users available'}
                </p>
              </div>
            )}
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="glass-morphism p-6 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-opacity-60 text-sm font-medium uppercase tracking-wide">Total Users</p>
                  <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-morphism p-6 animate-slide-up" style={{animationDelay: '0.4s'}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-opacity-60 text-sm font-medium uppercase tracking-wide">Active Users</p>
                  <p className="text-2xl font-bold text-white mt-1">{users.filter(u => u.status === 'active').length}</p>
                </div>
                <div className="w-10 h-10 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-morphism p-6 animate-slide-up" style={{animationDelay: '0.5s'}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-opacity-60 text-sm font-medium uppercase tracking-wide">Admins</p>
                  <p className="text-2xl font-bold text-white mt-1">{users.filter(u => u.role === 'admin').length}</p>
                </div>
                <div className="w-10 h-10 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 16L3 14l5.5-5.5L12 12l4.5-4.5L22 10l-2 2-4.5-4.5L12 11l-3.5-3.5L5 16z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-morphism p-6 animate-slide-up" style={{animationDelay: '0.6s'}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-opacity-60 text-sm font-medium uppercase tracking-wide">New This Month</p>
                  <p className="text-2xl font-bold text-white mt-1">{users.filter(u => new Date(u.joinDate) >= new Date(new Date().setDate(1))).length}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass-morphism p-8 max-w-2xl w-full animate-bounce-in">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-lg font-medium text-white">
                    {selectedUser.avatar}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedUser.name}</h2>
                    <p className="text-white text-opacity-70 mb-2">{selectedUser.email}</p>
                    <div className="flex items-center space-x-2">
                      {getRoleBadge(selectedUser.role)}
                      {getStatusBadge(selectedUser.status)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white bg-opacity-5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{selectedUser.teams.length}</div>
                  <div className="text-white text-opacity-60 text-sm">Teams</div>
                </div>
                <div className="bg-white bg-opacity-5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{selectedUser.projects}</div>
                  <div className="text-white text-opacity-60 text-sm">Projects</div>
                </div>
                <div className="bg-white bg-opacity-5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{new Date(selectedUser.joinDate).toLocaleDateString()}</div>
                  <div className="text-white text-opacity-60 text-sm">Joined</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Team Memberships</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.teams.map((team, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-2 bg-blue-500 bg-opacity-20 text-blue-300 rounded-lg text-sm font-medium border border-blue-500 border-opacity-30">
                      {team}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Activity Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white text-opacity-60">Last Active:</span>
                    <span className="text-white">{formatLastActive(selectedUser.lastActive)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white text-opacity-60">Join Date:</span>
                    <span className="text-white">{new Date(selectedUser.joinDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white text-opacity-60">Account Status:</span>
                    <span className={`font-medium ${selectedUser.status === 'active' ? 'text-green-300' : 'text-gray-300'}`}>
                      {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button className="btn-secondary flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit User</span>
                </button>
                <button
                  onClick={() => {
                    handleToggleUserStatus(selectedUser.id);
                    setSelectedUser({ ...selectedUser, status: selectedUser.status === 'active' ? 'inactive' : 'active' });
                  }}
                  className={`btn-secondary flex items-center space-x-2 ${
                    selectedUser.status === 'active' 
                      ? 'text-yellow-300 border-yellow-500 border-opacity-30 hover:bg-yellow-500 hover:bg-opacity-20' 
                      : 'text-green-300 border-green-500 border-opacity-30 hover:bg-green-500 hover:bg-opacity-20'
                  }`}
                >
                  {selectedUser.status === 'active' ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                      </svg>
                      <span>Deactivate</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Activate</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    handleDeleteUser(selectedUser.id);
                    setSelectedUser(null);
                  }}
                  className="btn-secondary text-red-300 border-red-500 border-opacity-30 hover:bg-red-500 hover:bg-opacity-20 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete User</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}