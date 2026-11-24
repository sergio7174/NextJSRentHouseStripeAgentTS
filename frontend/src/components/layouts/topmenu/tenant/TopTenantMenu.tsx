
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BsBook,
  BsCurrencyDollar,
  BsPersonFillGear,
  BsBoxArrowRight,
  BsList,
  BsX,
} from "react-icons/bs";

import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { clearUser } from "../../../../store/slices/userSlice";
import { environment } from '../../../../environments/environments';

const menuItems = [
  {
    label: "House/Booking",
    href: "/tenant/tenantdashboard",
    Icon: BsBook,
  },
  {
    label: "Account/Maintenance",
    href: "/tenant/tenantaccountmaintpage",
    Icon: BsCurrencyDollar,
  },
  {
    label: "Profile",
    href: "/tenant/tenantprofilepage",
    Icon: BsPersonFillGear,
  },
];



export default function TopTenantMenu() {
 

  const baseUrl = environment.endpointI;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  // 1. Get role from Redux
  const reduxRole = useAppSelector((state) => state.user.role);
  // 2. Fallback to localStorage if Redux role is null
  const localRole = typeof window !== 'undefined' ? localStorage.getItem('userChoice') : null;
  // Use reduxRole first, fallback to localRole
  const role = reduxRole || localRole;
  
    // Read user information from Redux
    const { name, isAuthenticated } = useAppSelector(
      (state) => state.user
    );
  
  // Check localStorage as a fallback for page refreshes
  const hasLocalToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
  const isUserAuthenticated = isAuthenticated || hasLocalToken;

  // 1. Initialize state with your fallback value ('None')
  const [userImage, setUserImage] = useState('None');

  // Ensure component only renders auth-dependent UI after mounting on client
  useEffect(() => {
    const userImage = localStorage.getItem('userImage');
    if (userImage) {
      setUserImage(userImage);
    }
    setHasMounted(true);
  }, []);

    // If not authenticated or not a Tenant, return null
  if (!isUserAuthenticated || !role || role !== "Tenant") {
    return null;
  }

  // If not mounted yet, render nothing or a safe skeleton to prevent SSR mismatch
  if (!hasMounted) {
    return null;
  }

 // Generate user initials
  const getInitials = (username: string | null): string => {
    return (
      username
        ?.trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join("") || "T"
    );
  };

 // Active navigation
  const isActive = (pathname: string | null, href: string): boolean => {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
};

// Close responsive menu
  const closeMenu = (): void => {
    setMenuOpen(false);
  };

  // Tenant logout
  const handleLogout = (): void => {
    dispatch(clearUser());
    setMenuOpen(false);

    router.replace("/login");
  };

  return (
    <>
    <nav
      className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm"
      aria-label="Tenant navigation"
    >
      <div className="container-fluid">

        {/* Tenant Logo and Name */}
        <Link
          href="/tenantdashboard"
          className="navbar-brand d-flex align-items-center gap-2"
          onClick={closeMenu}
        >
          {userImage ? (
            <img
              src={`${baseUrl+userImage}`}
              alt="Tenant"
              width={42}
              height={42}
              style={{
                objectFit: "cover",
                borderRadius: "5px",
              }}
            />
          ) : (
            <span
              className="d-flex align-items-center justify-content-center bg-secondary text-white rounded"
              style={{
                width: "42px",
                height: "42px",
                fontWeight: "bold",
              }}
            >
              {getInitials(name)}
            </span>
          )}

          <span className="text-white fw-semibold">
            {name || "Tenant"}
          </span>
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          aria-controls="tenantNavbar"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? (
            <BsX size={26} />
          ) : (
            <BsList size={26} />
          )}
        </button>

        {/* Navigation Items */}
        <div
          id="tenantNavbar"
          className={`collapse navbar-collapse ${
            menuOpen ? "show" : ""
          }`}
        >
          <ul className="navbar-nav me-auto ms-lg-5 gap-lg-3">

            {menuItems.map((item) => {
              const Icon = item.Icon;
              //const active = isActive(item.href);
              const active = isActive(pathname, "/tenantdashboard");
              return (
                <li className="nav-item" key={item.href}>
                  <Link
                    href={item.href}
                    className={`nav-link d-flex align-items-center gap-2 px-3 ${
                      active
                        ? "active fw-bold text-white"
                        : "text-white"
                    }`}
                    aria-current={active ? "page" : undefined}
                    onClick={closeMenu}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                </li>
              );
            })}

          </ul>

          {/* Tenant Logout */}
          <div className="d-flex align-items-center ms-auto mt-3 mt-lg-0">
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleLogout}
            >
              <BsBoxArrowRight className="me-2" />
              Sign out
            </button>
          </div>

        </div>
      </div>
    </nav>
   
     
    </>
  );
}
