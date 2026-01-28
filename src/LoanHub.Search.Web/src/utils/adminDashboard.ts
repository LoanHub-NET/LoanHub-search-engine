import type { DashboardStats, LoanApplication } from '../types/admin.types';

export const calculateDashboardStats = (applications: LoanApplication[]): DashboardStats => {
  const stats: DashboardStats = {
    total: applications.length,
    new: 0,
    preliminarilyAccepted: 0,
    accepted: 0,
    granted: 0,
    rejected: 0,
    expired: 0,
    avgProcessingTime: 0,
    pendingReview: 0,
  };

  let totalProcessingTime = 0;
  let processedCount = 0;

  for (const app of applications) {
    switch (app.status) {
      case 'new':
        stats.new++;
        stats.pendingReview++;
        break;
      case 'preliminarily_accepted':
        stats.preliminarilyAccepted++;
        break;
      case 'accepted':
        stats.accepted++;
        break;
      case 'granted':
        stats.granted++;
        break;
      case 'rejected':
        stats.rejected++;
        break;
      case 'expired':
        stats.expired++;
        break;
    }

    if (app.status !== 'new' && app.statusHistory.length > 1) {
      const firstDecision = app.statusHistory.find(h => h.previousStatus === 'new');
      if (firstDecision) {
        const processingTime =
          (new Date(firstDecision.changedAt).getTime() - new Date(app.createdAt).getTime())
          / (1000 * 60 * 60);
        totalProcessingTime += processingTime;
        processedCount++;
      }
    }
  }

  if (processedCount > 0) {
    stats.avgProcessingTime = Math.round((totalProcessingTime / processedCount) * 10) / 10;
  }

  return stats;
};
