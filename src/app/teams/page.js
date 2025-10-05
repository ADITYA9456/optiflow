'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    members: []
  });
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
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }

    fetchTeams();
  }, [router]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      // Mock data for demo purposes
      const mockTeams = [
        {
          id: 1,
          name: 'Development Team',
          description: 'Frontend and backend developers working on core products',
          members: ['John Doe', 'Jane Smith', 'Mike Johnson'],
          projects: 5,
          status: 'active',
          created: '2024-01-15',
          color: 'blue'
        },
        {
          id: 2,
          name: 'QA Team',
          description: 'Quality assurance and testing specialists',
          members: ['Sarah Wilson', 'Tom Brown'],
          projects: 3,
          status: 'active',
          created: '2024-01-20',
          color: 'green'
        },
        {
          id: 3,
          name: 'Marketing Team',
          description: 'Digital marketing and content creation',
          members: ['Emily Davis', 'Chris Lee', 'Alex Turner', 'Lisa Wang'],
          projects: 8,
          status: 'active',
          created: '2024-01-10',
          color: 'purple'
        },
        {
          id: 4,
          name: 'Design Team',
          description: 'UI/UX designers and graphic artists',
          members: ['David Kim', 'Rachel Green'],
          projects: 4,
          status: 'inactive',
          created: '2024-01-25',
          color: 'orange'
        }
      ];
      
      setTeams(mockTeams);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const newTeamData = {
        id: teams.length + 1,
        name: newTeam.name,
        description: newTeam.description,
        members: newTeam.members,
        projects: 0,
        status: 'active',
        created: new Date().toISOString().split('T')[0],
        color: 'blue'
      };
      
      setTeams([...teams, newTeamData]);
      setNewTeam({ name: '', description: '', members: [] });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const handleDeleteTeam = (teamId) => {
    setTeams(teams.filter(team => team.id !== teamId));
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getTeamColorClasses = (color) => {
    const colorMap = {
      blue: 'from-blue-500 to-blue-600 border-blue-400',
      green: 'from-green-500 to-green-600 border-green-400',
      purple: 'from-purple-500 to-purple-600 border-purple-400',
      orange: 'from-orange-500 to-orange-600 border-orange-400'
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="glass-morphism p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-opacity-80">Loading teams...</p>
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
              <h1 className="text-3xl font-bold text-white mb-2">Teams Management</h1>
              <p className="text-white text-opacity-80">Organize and manage your workflow teams</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Team</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="glass-morphism p-6 mb-8 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="relative flex-1 max-w-lg">
                <input
                  type="text"
                  placeholder="Search teams..."
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
                <span className="text-white text-opacity-60 text-sm">
                  {filteredTeams.length} of {teams.length} teams
                </span>
              </div>
            </div>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredTeams.map((team, index) => (
              <div
                key={team.id}
                className="glass-morphism p-6 hover:scale-105 transition-all duration-300 cursor-pointer animate-bounce-in"
                style={{animationDelay: `${0.2 + index * 0.1}s`}}
                onClick={() => setSelectedTeam(team)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getTeamColorClasses(team.color)} rounded-xl flex items-center justify-center border`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  {getStatusBadge(team.status)}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{team.name}</h3>
                <p className="text-white text-opacity-70 text-sm mb-4 line-clamp-2">{team.description}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white text-opacity-60">Members</span>
                    <span className="text-white font-medium">{team.members.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white text-opacity-60">Projects</span>
                    <span className="text-white font-medium">{team.projects}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white text-opacity-60">Created</span>
                    <span className="text-white font-medium">{new Date(team.created).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-4 flex -space-x-2">
                  {team.members.slice(0, 3).map((member, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white border-opacity-20 flex items-center justify-center text-xs font-medium text-white"
                    >
                      {member.split(' ').map(n => n[0]).join('')}
                    </div>
                  ))}
                  {team.members.length > 3 && (
                    <div className="w-8 h-8 bg-gray-600 bg-opacity-50 rounded-full border-2 border-white border-opacity-20 flex items-center justify-center text-xs font-medium text-white">
                      +{team.members.length - 3}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredTeams.length === 0 && (
            <div className="glass-morphism p-12 text-center animate-fade-in">
              <div className="w-16 h-16 bg-gray-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No teams found</h3>
              <p className="text-white text-opacity-60 mb-6">
                {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating your first team'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary"
                >
                  Create Your First Team
                </button>
              )}
            </div>
          )}
        </div>

        {/* Create Team Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass-morphism p-8 max-w-md w-full animate-bounce-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Create New Team</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateTeam} className="space-y-6">
                <div>
                  <label htmlFor="teamName" className="block text-sm font-medium text-white mb-2">
                    Team Name
                  </label>
                  <input
                    id="teamName"
                    type="text"
                    required
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    className="input-field w-full"
                    placeholder="Enter team name"
                  />
                </div>

                <div>
                  <label htmlFor="teamDescription" className="block text-sm font-medium text-white mb-2">
                    Description
                  </label>
                  <textarea
                    id="teamDescription"
                    rows={3}
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    className="input-field w-full resize-none"
                    placeholder="Describe the team's purpose and responsibilities"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    Create Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Team Details Modal */}
        {selectedTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass-morphism p-8 max-w-2xl w-full animate-bounce-in">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${getTeamColorClasses(selectedTeam.color)} rounded-xl flex items-center justify-center border`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedTeam.name}</h2>
                    <p className="text-white text-opacity-70">{selectedTeam.description}</p>
                    <div className="mt-2">{getStatusBadge(selectedTeam.status)}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white bg-opacity-5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{selectedTeam.members.length}</div>
                  <div className="text-white text-opacity-60 text-sm">Members</div>
                </div>
                <div className="bg-white bg-opacity-5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{selectedTeam.projects}</div>
                  <div className="text-white text-opacity-60 text-sm">Projects</div>
                </div>
                <div className="bg-white bg-opacity-5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{new Date(selectedTeam.created).toLocaleDateString()}</div>
                  <div className="text-white text-opacity-60 text-sm">Created</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Team Members</h3>
                <div className="space-y-2">
                  {selectedTeam.members.map((member, index) => (
                    <div key={index} className="flex items-center p-3 bg-white bg-opacity-5 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-sm font-medium text-white mr-3">
                        {member.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-white font-medium">{member}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button className="btn-secondary flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Team</span>
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      handleDeleteTeam(selectedTeam.id);
                      setSelectedTeam(null);
                    }}
                    className="btn-secondary text-red-300 border-red-500 border-opacity-30 hover:bg-red-500 hover:bg-opacity-20 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Team</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}