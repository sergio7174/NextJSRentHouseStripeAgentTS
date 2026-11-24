'use client';

import { useMemo } from 'react';
import { useGetLatestRequestsQuery } from '@/store/api/dashboardApi';
import styles from './maint-req-pipeline.module.css';

/* ============================================================
   MaintReqPipeline
   Right panel — pipeline of latest maintenance requests.
   ============================================================ */
export default function MaintReqPipeline() {
  /* ---------- RTK Query: latest maintenance requests ---------- */
  const {
    data: requestsRaw = [],
    isLoading,
    isError,
  } = useGetLatestRequestsQuery();

  const requests: any[] = useMemo(() => {
    if (!Array.isArray(requestsRaw)) return [];
    return requestsRaw as any[];
  }, [requestsRaw]);

  /* ---------- Status class helper ---------- */
  const getStatusClass = (status: string | undefined): string => {
    switch ((status ?? '').toLowerCase()) {
      case 'pending':
        return styles.maintStatusPending;
      case 'in progress':
        return styles.maintStatusProgress;
      case 'completed':
        return styles.maintStatusCompleted;
      default:
        return styles.maintStatusDefault;
    }
  };

  /* ---------- Manage (no-op, matches Angular) ---------- */
  const manageRequest = (request: any) => {
    console.log(
      'Inspecting operational log mapping context for:',
      request.houseCode
    );
  };

  /* ---------- Render ---------- */
  return (
    <>
      <div className={styles.columnHeaderSticky}>
        <h2 className={styles.columnTitle}>
          <i className="bi bi-exclamation-triangle-fill text-warning me-2" />
          Maintenance Requests Pipeline
        </h2>
      </div>

      <div
        className={`${styles.scrollContainerVertical} ${styles.maintenanceScrollBox}`}
      >
        {isLoading && (
          <p style={{ color: '#94a3b8', padding: '20px 0' }}>
            Loading maintenance requests…
          </p>
        )}

        {isError && (
          <p style={{ color: '#f87171', padding: '20px 0' }}>
            Could not load maintenance logs.
          </p>
        )}

        {!isLoading && !isError && requests.length === 0 && (
          <p style={{ color: '#94a3b8', padding: '20px 0' }}>
            No maintenance requests yet.
          </p>
        )}

        {requests.length > 0 && (
          <div className={styles.maintenanceFlexList}>
            {requests.map((req: any) => (
              <div
                key={req._id ?? req.houseCode}
                className={`${styles.maintenanceRowItem} ${styles.animateFadeIn}`}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <span className={`${styles.maintHouseCode} font-monospace fw-bold`}>
                      {req.houseCode}
                    </span>
                    <p className={`${styles.maintDesc} mt-1 mb-0`}>
                      {req.maintenaceRequest}
                    </p>
                  </div>
                  <span
                    className={`${styles.badgeStatusPill} ${getStatusClass(
                      req.maintenaceRequestStatus
                    )}`}
                  >
                    {req.maintenaceRequestStatus}
                  </span>
                </div>

                <div className={`${styles.maintFooter} d-flex justify-content-between align-items-center mt-2 border-top pt-2`}>
                  <span className={`${styles.maintLoc} text-muted small`}>
                    <i className="bi bi-geo-alt me-1" />
                    {req.city}, {req.state}
                  </span>
                  <button
                    type="button"
                    className={styles.btnActionSmall}
                    onClick={() => manageRequest(req)}
                    aria-label="Inspect maintenance request"
                  >
                    <i className="bi bi-eye" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}