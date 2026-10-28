/**
 * Calculates remaining days / countdown for a project
 * @param {Object} project 
 * @returns {{ text: string, days: number, isCompleted: boolean } | null}
 */
export const getProjectDaysLeft = (project) => {
  if (!project) return null;

  if (project.status === 'COMPLETED') {
    return { text: 'Completed', days: 0, isCompleted: true };
  }

  let targetDate = null;
  if (project.completionDate) {
    targetDate = new Date(project.completionDate);
  } else if (project.ongoingStartDate && project.duration) {
    targetDate = new Date(new Date(project.ongoingStartDate).getTime() + (parseInt(project.duration) * 30 * 24 * 60 * 60 * 1000));
  } else if (project.activeDeadline) {
    targetDate = new Date(project.activeDeadline);
  } else if (project.duration && (project.created_at || project.createdAt)) {
    const start = new Date(project.created_at || project.createdAt);
    targetDate = new Date(start.getTime() + (parseInt(project.duration) * 30 * 24 * 60 * 60 * 1000));
  }

  if (!targetDate || isNaN(targetDate.getTime())) return null;

  const now = new Date();
  const diffTime = targetDate - now;

  if (diffTime <= 0) {
    return { text: 'Pending Settlement', days: 0, isCompleted: true };
  }

  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return {
    text: days === 1 ? '1 Day Left' : `${days} Days Left`,
    days,
    isCompleted: false
  };
};
