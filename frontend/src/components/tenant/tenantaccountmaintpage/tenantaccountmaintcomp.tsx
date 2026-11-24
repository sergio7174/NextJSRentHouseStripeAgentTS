'use client';

import styles from './tenantaccountmaintpage.module.css';
import Tenantaccountpage from './tenantaccountcomp/tenantaccountcomp';
import TopTenantMenu from "../../layouts/topmenu/tenant/TopTenantMenu";
import Footer from "../../layouts/footer/footer";

/* ============================================================
   Tenantaccountmaintpage
   Pure layout shell — no props, no data fetching.
   The child Tenantaccountpage handles its own state / queries.
   ============================================================ */
export default function Tenantaccountmaintpage() {
  return (
    <>
    <TopTenantMenu/>
    <div className={styles.tenantDashboardWrapper}>
      <div className={styles.blurOverlay}>
        <header className={styles.dashboardHeaderPanel}>
          <h1 style={{ textAlign: 'center' }}>
            Tenant Dashboard / (Account / Maintenance)
          </h1>
          <p className={styles.panelMetaSubtitle} style={{ textAlign: 'center' }}>
            Browse premium vacancies or track active leases and operational
            support statuses.
          </p>
        </header>

        <main className={styles.workspaceFlexGrid}>
          <Tenantaccountpage />
        </main>
      </div>
    </div>
    <Footer/>
    </>
  );
}