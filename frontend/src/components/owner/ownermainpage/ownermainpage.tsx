// ============================================================================
// FILE: /app/components/owner/ownermainpage.tsx
// PURPOSE: Focused Playwright E2E spec for Owner house creation flow
// ============================================================================
'use client';

import styles from './ownermainpage.module.css';

// Children handle their own props / store / API internally.
import Ownermainpagesecleft from '../ownermainpagesecleft/ownermainpagesecleft';
import Ownermainpagesecright from '../ownermainpagesecright/ownermainpagesecright';
import TopOwnerMenu from "../../layouts/topmenu/owner/TopOwnerMenu";
import Footer from "../../layouts/footer/footer";

/* ============================================================
   Ownermainpage
   Pure layout shell — no props, no data fetching.
   Each child is responsible for its own state, queries, mutations.
   ============================================================ */
export default function Ownermainpage() {
  return (
    <>
   <TopOwnerMenu/>
    <div className={styles.ownerDashboardWrapper}>
      <div className={styles.blurOverlay}>
         
        <header className={styles.dashboardHeaderPanel}>
          <h1 style={{ textAlign: 'center' }}>
            Owner Dashboard(Houses / Bookings)
          </h1>
          <p className={styles.panelMetaSubtitle} style={{ textAlign: 'center' }}>
            Browse premium vacancies or track active leases and operational support statuses.
          </p>
        </header>

        <main className={styles.workspaceFlexGrid}>
          <Ownermainpagesecleft />
          <Ownermainpagesecright />
        </main>
      </div>
    </div>
    <Footer/>
    </>
  );
}