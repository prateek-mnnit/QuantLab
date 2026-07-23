/**
 * Shape returned by GET /api/health. Shared so the frontend's health-status
 * widget and the backend controller that produces it can never drift apart.
 */
export interface HealthCheckResult {
  status: 'ok';
  timestamp: string;
  database: 'connected';
}
