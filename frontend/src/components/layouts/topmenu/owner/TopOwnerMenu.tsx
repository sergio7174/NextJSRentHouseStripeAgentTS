// ============================================================================
// FILE: /app/components/layouts/owner/topownermenu
// ============================================================================
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BsHouseAddFill,
  BsCurrencyDollar,
  BsPersonFillGear,
  BsBook,
  BsCardList,
  BsBoxArrowRight,
  BsList,
  BsX,
  BsChevronDown,
} from "react-icons/bs";

import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { clearUser } from "../../../../store/slices/userSlice";
import { environment } from "../../../../environments/environments";

/* ============================================================
   Menu items — matches the Angular topownermenu options
   ============================================================ */
const menuItems = [
  {
    label: "Home",
    href: "/owner/ownerdashboard",
    Icon: BsHouseAddFill,
  },
  {
    label: "Account/Maintenance",
    href: "/owner/owneraccountmaintpage",
    Icon: BsCurrencyDollar,
  },
  {
    label: "Profile",
    href: "/owner/ownerprofile",
    Icon: BsPersonFillGear,
  },
];

/* Houses dropdown sub-items (from the Angular template) */
const houseSubmenu = [
  {
    label: "House Create",
    href: "/owner/ownercreatehouse",
    Icon: BsHouseAddFill,
  },
  {
    label: "Houses List",
    href: "/owner/Ownerlisthouses",
    Icon: BsCardList,
  },
];

/* ============================================================
   Topownermenu
   ============================================================ */
export default function Topownermenu() {
  const baseUrl = environment.endpoint;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [housesOpen, setHousesOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  /* 1. Role from Redux */
  const reduxRole = useAppSelector((state) => state.user.role);

  /* 2. Fallback to localStorage if Redux role is null */
  const localRole =
    typeof window !== "undefined"
      ? localStorage.getItem("userChoice")
      : null;

  const role = reduxRole || localRole;

  /* User info from Redux */
  const { name, isAuthenticated } = useAppSelector((state) => state.user);

  /* localStorage token fallback for refresh */
  const hasLocalToken =
    typeof window !== "undefined" && !!localStorage.getItem("token");
  const isUserAuthenticated = isAuthenticated || hasLocalToken;

  /* Owner image — mirror TopTenantMenu's local-state pattern */
  const [ownerImage, setOwnerImage] = useState("None");

  useEffect(() => {
    const storedImage = localStorage.getItem("userImage");
    if (storedImage) setOwnerImage(storedImage);
    setHasMounted(true);
  }, []);

  /* Guard: only show for authenticated Owners */
  if (!isUserAuthenticated || !role || role !== "Owner") {
    return null;
  }

  /* Wait for client mount to avoid SSR mismatch */
  if (!hasMounted) {
    return null;
  }

  /* Initials fallback */
  const getInitials = (username: string | null): string => {
    return (
      username
        ?.trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join("") || "O"
    );
  };

  /* Active route helper */
  const isActive = (currentPathname: string | null, href: string): boolean => {
    if (!currentPathname) return false;
    return (
      currentPathname === href ||
      currentPathname.startsWith(`${href}/`)
    );
  };

  const closeMenu = (): void => {
    setMenuOpen(false);
    setHousesOpen(false);
  };

  /* Owner logout */
  const handleLogout = (): void => {
    dispatch(clearUser());
    setMenuOpen(false);
    router.replace("/login");
  };

  return (
    <>
      <nav
        className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm"
        aria-label="Owner navigation"
      >
        <div className="container-fluid">
          {/* Owner Logo and Name */}
          <Link
            href="/owner/ownerdashboard"
            className="navbar-brand d-flex align-items-center gap-2"
            onClick={closeMenu}
          >
            {ownerImage && ownerImage !== "None" ? (
              <img
                src={`${baseUrl}/${ownerImage}`}
                alt="Owner"
                width={42}
                height={42}
                style={{ objectFit: "cover", borderRadius: "5px" }}
              />
            ) : (
              <span
                className="d-flex align-items-center justify-content-center bg-secondary text-white rounded"
                style={{ width: "42px", height: "42px", fontWeight: "bold" }}
              >
                {getInitials(name)}
              </span>
            )}

            <span className="text-white fw-semibold">{name || "Owner"}</span>
          </Link>

          {/* Mobile toggle */}
          <button
            className="navbar-toggler"
            type="button"
            aria-label="Toggle navigation"
            aria-controls="ownerNavbar"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? <BsX size={26} /> : <BsList size={26} />}
          </button>

          {/* Navigation Items */}
          <div
            id="ownerNavbar"
            className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}
          >
            <ul className="navbar-nav me-auto ms-lg-5 gap-lg-3">
              {/* Home */}
              <li className="nav-item">
                <Link
                  href="/owner/ownerdashboard"
                  className={`nav-link d-flex align-items-center gap-2 px-3 ${
                    isActive(pathname, "/owner/ownerdashboard") &&
                    !pathname?.startsWith("/owner/ownerdashboard/Owner")
                      ? "active fw-bold text-white"
                      : "text-white"
                  }`}
                  aria-current={
                    isActive(pathname, "/owner/ownerdashboard")
                      ? "page"
                      : undefined
                  }
                  onClick={closeMenu}
                >
                  <BsHouseAddFill size={18} />
                  Home
                </Link>
              </li>

              {/* Houses dropdown */}
              <li className="nav-item dropdown">
                <button
                  type="button"
                  className="nav-link dropdown-toggle d-flex align-items-center gap-2 px-3 text-white bg-transparent border-0"
                  aria-haspopup="true"
                  aria-expanded={housesOpen}
                  onClick={() => setHousesOpen((prev) => !prev)}
                >
                  <BsBook size={18} />
                  Houses
                  <BsChevronDown size={12} />
                </button>

                <ul
                  className={`dropdown-menu ${housesOpen ? "show" : ""}`}
                  style={{ background: "rgb(175, 171, 167)" }}
                >
                  {houseSubmenu.map((item) => {
                    const Icon = item.Icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="dropdown-item d-flex align-items-center gap-2"
                          style={{
                            color: "rgb(35, 66, 124)",
                            textAlign: "center",
                          }}
                          onClick={closeMenu}
                        >
                          <Icon size={16} />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>

              {/* Account/Maintenance + Profile (loop over remaining items) */}
              {menuItems.slice(1).map((item) => {
                const Icon = item.Icon;
                const active = isActive(pathname, item.href);
                return (
                  <li className="nav-item" key={item.href}>
                    <Link
                      href={item.href}
                      className={`nav-link d-flex align-items-center gap-2 px-3 ${
                        active ? "active fw-bold text-white" : "text-white"
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

            {/* Owner Logout */}
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