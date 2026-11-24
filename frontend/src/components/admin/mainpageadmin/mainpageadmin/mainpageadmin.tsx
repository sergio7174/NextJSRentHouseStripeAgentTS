'use client';

import styles from './mainpageadmin.module.css';

// Children handle their own state / queries internally.
// Adjust import paths to wherever you placed them.
  import Kpimatrixsection from '../kpimatrixsection/kpimatrixsection';
  import RecentlyAddedBookings from '../recently-added-bookings/recently-added-bookings'; 
  import MaintReqPipeline from '../maint-req-pipeline/maint-req-pipeline';
  import TopAdminMenu from "../../../layouts/topmenu/admin/TopAdminMenu";
  import Footer from "../../../layouts/footer/footer";
  

/* ============================================================
   Mainpageadmin
   Pure layout shell — no props, no data fetching.
   ============================================================ */
export default function Mainpageadmin() {
  return (
    <>
    <TopAdminMenu/>
    <div className={styles.adminDashboardWrapper}>
      <header className={styles.dashboardHeader}>
        <h1 className={styles.mainTitle}>Admin Dashboard</h1>
        <p className={styles.subtitle}>
          RentControl Real-Time Property &amp; System Metrics Ecosystem
        </p>
      </header>

      <Kpimatrixsection />

      <section className={styles.dashboardSplitLayout}>
  //     <RecentlyAddedBookings />

        <div className={`${styles.splitColumn} ${styles.maintenanceColumn}`}>
          <MaintReqPipeline />
        </div>
      </section>
    </div>
    <Footer/>
    </>
  );
}