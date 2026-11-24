import TenantMainPageSecLeft from "../tenantmainpagesecleft/tenantmainpagesecleft";
import Tenantmainpagesecright from "../tenantmainpagesecright/tenantmainpagesecright"
import TopTenantMenu from "../../layouts/topmenu/tenant/TopTenantMenu";
import Footer from "@/components/layouts/footer/footer";

import styles from "./TenantMainPage.module.css";

interface TenantMainPageProps {
  title?: string;
}

export default function TenantMainPage({
  title = "Tenant Dashboard",
}: TenantMainPageProps) {
  return (
    <>
  <TopTenantMenu />
    <div className={styles.tenantDashboardWrapper}> 
      <div className={styles.blurOverlay}>
        <header className={styles.dashboardHeaderPanel}>
          <h1>{title} (Houses / Bookings)</h1>

          <p className={styles.panelMetaSubtitle}>
            Browse premium vacancies or track active leases and operational
            support statuses.
          </p>
        </header>
       
        <main className={styles.workspaceFlexGrid}>
          
         <TenantMainPageSecLeft />
         <Tenantmainpagesecright />
        </main>
      </div>
    </div>
    <Footer/>
   </> 
  );
}