export const calculateOnboardingProgress = (tasks: any[]) => {
  if (!tasks || tasks.length === 0) return 0;
  
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  return Math.round((completedTasks / tasks.length) * 100);
};

export const getOnboardingPhase = (startDate: string) => {
  const start = new Date(startDate);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 7) return 'Week 1: Getting Started';
  if (daysDiff <= 30) return 'Month 1: Foundation Building';
  if (daysDiff <= 90) return 'Month 2-3: Integration';
  return 'Ongoing: Full Integration';
};

export const getTasksByStatus = (tasks: any[]) => {
  return {
    completed: tasks.filter(task => task.status === 'completed').length,
    inProgress: tasks.filter(task => task.status === 'in-progress').length,
    pending: tasks.filter(task => task.status === 'pending').length,
  };
};

export const getUpcomingTasks = (tasks: any[], limit = 3) => {
  return tasks
    .filter(task => task.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, limit);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getDaysUntilDue = (dueDate: string) => {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-success';
    case 'in-progress':
      return 'text-warning';
    case 'pending':
      return 'text-danger';
    default:
      return 'text-text-muted';
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'text-danger';
    case 'medium':
      return 'text-warning';
    case 'low':
      return 'text-success';
    default:
      return 'text-text-muted';
  }
};