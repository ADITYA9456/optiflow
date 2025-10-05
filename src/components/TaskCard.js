'use client';

import { motion } from 'framer-motion';

export default function TaskCard({ task, onUpdateStatus, onDelete, onEdit }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'from-red-500/20 to-red-600/30 border-red-500/30';
      case 'medium': return 'from-yellow-500/20 to-orange-600/30 border-yellow-500/30';
      case 'low': return 'from-green-500/20 to-emerald-600/30 border-green-500/30';
      default: return 'from-gray-500/20 to-gray-600/30 border-gray-500/30';
    }
  };

  const getPriorityTextColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'from-green-500/20 to-emerald-600/30 border-green-500/30 text-green-400';
      case 'in-progress': return 'from-blue-500/20 to-blue-600/30 border-blue-500/30 text-blue-400';
      case 'pending': return 'from-gray-500/20 to-gray-600/30 border-gray-500/30 text-gray-400';
      default: return 'from-gray-500/20 to-gray-600/30 border-gray-500/30 text-gray-400';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';

  return (
    <motion.div 
      className={`bg-white/5 backdrop-blur-xl border rounded-2xl p-6 relative overflow-hidden group hover:bg-white/10 transition-all duration-300 ${
        isOverdue ? 'border-red-500/40 bg-red-500/5' : 'border-white/10'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.02, 
        y: -5,
        boxShadow: "0 20px 40px -10px rgba(147, 51, 234, 0.3)"
      }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Background gradient on hover */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <motion.h3 
              className="text-lg font-semibold text-white mb-2 group-hover:text-blue-200 transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {task.title}
            </motion.h3>
            
            {/* Priority and Status badges */}
            <div className="flex items-center space-x-2 mb-3">
              <motion.span 
                className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r border ${getPriorityColor(task.priority)} ${getPriorityTextColor(task.priority)}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                {task.priority?.toUpperCase()}
              </motion.span>
              <motion.span 
                className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r border ${getStatusColor(task.status)}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                {task.status?.replace('-', ' ').toUpperCase()}
              </motion.span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.button
              onClick={() => onEdit(task)}
              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </motion.button>
            <motion.button
              onClick={() => onDelete(task._id)}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <motion.p 
            className="text-white/70 text-sm mb-4 line-clamp-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {task.description}
          </motion.p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <motion.div 
            className="flex items-center text-white/60 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={isOverdue ? 'text-red-400 font-medium' : ''}>
              {formatDate(task.deadline)}
              {isOverdue && ' (Overdue)'}
            </span>
          </motion.div>
          
          {/* Status update dropdown */}
          <motion.select
            value={task.status}
            onChange={(e) => onUpdateStatus(task._id, e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <option value="pending" className="bg-gray-900 text-white">Pending</option>
            <option value="in-progress" className="bg-gray-900 text-white">In Progress</option>
            <option value="completed" className="bg-gray-900 text-white">Completed</option>
          </motion.select>
        </div>
      </div>
      
      {/* Overdue indicator */}
      {isOverdue && (
        <motion.div 
          className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity
          }}
        />
      )}
    </motion.div>
  );
}