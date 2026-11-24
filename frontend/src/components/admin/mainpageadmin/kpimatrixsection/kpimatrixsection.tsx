'use client';

import { useGetAllHousesQuery } from '@/store/api/houseApi';
import { useGetMetricsQuery } from '@/store/api/dashboardApi';
import styles from './kpimatrixsection.module.css';

/* ============================================================
   Helper — format USD with 2 decimals
   ============================================================ */
const fmtUSD = (n: number | undefined | null) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n ?? 0));

/* ============================================================
   Kpimatrixsection
   ============================================================ */
export default function Kpimatrixsection() {
  /* ---------- RTK Query: total houses ---------- */
  const { data: allHouses } = useGetAllHousesQuery();

  // houseApi returns a normalized array (via normalizeHouseList).
  // If your backend also exposes `total`, prefer that; otherwise fall back
  // to the array length — matches the Angular intent.
  const allHousesRaw = allHouses as any;
  const allHousesNumber: number =
    typeof allHousesRaw?.total === 'number'
      ? allHousesRaw.total
      : Array.isArray(allHousesRaw)
      ? allHousesRaw.length
      : 0;

  /* ---------- RTK Query: dashboard metrics ---------- */
  const { data: stats } = useGetMetricsQuery();

  // Stable accessors with `?? 0` so nothing renders as "undefined"
  const s = (stats ?? {}) as any;
  const activeContracts = Number(s.activeContracts ?? 0);
  const incomingFunds = Number(s.incomingFunds ?? 0);
  const maintenanceRequests = Number(s.maintenanceRequests ?? 0);
  const activeUsersCount = Number(s.activeUsersCount ?? 0);
  const tenants = Number(s.tenants ?? 0);
  const owners = Number(s.owners ?? 0);
  const admins = Number(s.admins ?? 0);

  /* ---------- Render ---------- */
  return (
    <section className={styles.kpiMatrixSection}>
      <div className={styles.kpiGrid}>
        {/* Total Properties */}
        <div className={styles.glassKpiCard}>
          <div className={`${styles.kpiIconWrapper} text-primary`}>
            <i className="bi bi-house-door-fill" />
          </div>
          <div className={styles.kpiData}>
            <h3 className={styles.kpiValue}>{allHousesNumber}</h3>
            <span className={styles.kpiLabel}>Total Properties</span>
          </div>
        </div>

        {/* Active Contracts */}
        <div className={styles.glassKpiCard}>
          <div className={`${styles.kpiIconWrapper} text-success`}>
            <i className="bi bi-file-earmark-check-fill" />
          </div>
          <div className={styles.kpiData}>
            <h3 className={styles.kpiValue}>{activeContracts}</h3>
            <span className={styles.kpiLabel}>Active Contracts</span>
          </div>
        </div>

        {/* Incoming Funds */}
        <div className={styles.glassKpiCard}>
          <div className={`${styles.kpiIconWrapper} text-warning`}>
            <i className="bi bi-currency-dollar" />
          </div>
          <div className={styles.kpiData}>
            <h3 className={styles.kpiValue}>{fmtUSD(incomingFunds)}</h3>
            <span className={styles.kpiLabel}>Incoming Funds</span>
          </div>
        </div>

        {/* Maintenance Req. */}
        <div className={styles.glassKpiCard}>
          <div className={`${styles.kpiIconWrapper} text-danger`}>
            <i className="bi bi-tools" />
          </div>
          <div className={styles.kpiData}>
            <h3 className={styles.kpiValue}>{maintenanceRequests}</h3>
            <span className={styles.kpiLabel}>Maintenance Req.</span>
          </div>
        </div>

        {/* Active Users */}
        <div className={styles.glassKpiCard}>
          <div className={`${styles.kpiIconWrapper} text-info`}>
            <i className="bi bi-people-fill" />
          </div>
          <div className={styles.kpiData}>
            <h3 className={styles.kpiValue}>{activeUsersCount}</h3>
            <span className={styles.kpiLabel}>Active Users</span>
          </div>
        </div>

        {/* Active Tenants */}
        <div className={styles.glassKpiCard}>
          <div className={`${styles.kpiIconWrapper} text-indigo`}>
            <i className="bi bi-person-badge" />
          </div>
          <div className={styles.kpiData}>
            <h3 className={styles.kpiValue}>{tenants}</h3>
            <span className={styles.kpiLabel}>Active Tenants</span>
          </div>
        </div>

        {/* Active Owners */}
        <div className={styles.glassKpiCard}>
          <div className={`${styles.kpiIconWrapper} text-purple`}>
            <i className="bi bi-person-workspace" />
          </div>
          <div className={styles.kpiData}>
            <h3 className={styles.kpiValue}>{owners}</h3>
            <span className={styles.kpiLabel}>Active Owners</span>
          </div>
        </div>

        {/* Active Admins */}
        <div className={styles.glassKpiCard}>
          <div className={`${styles.kpiIconWrapper} text-pink`}>
            <i className="bi bi-shield-lock-fill" />
          </div>
          <div className={styles.kpiData}>
            <h3 className={styles.kpiValue}>{admins}</h3>
            <span className={styles.kpiLabel}>Active Admins</span>
          </div>
        </div>
      </div>
    </section>
  );
}