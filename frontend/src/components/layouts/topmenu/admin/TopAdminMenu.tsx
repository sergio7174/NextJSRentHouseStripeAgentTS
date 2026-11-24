"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BsBook,
  BsHouseAddFill,
  BsCurrencyDollar,
  BsGearWideConnected,
  BsPersonPlusFill,
  BsBoxArrowRight,
  BsList,
  BsX,
  BsChevronDown,
} from "react-icons/bs";

import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { clearUser } from "../../../../store/slices/userSlice";
import { environment } from "../../../../environments/environments";

/* ============================================================
   Dropdown menu tree — mirrors the Angular topadminmenu template
   ============================================================ */
interface AdminMenuItem {
  key: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  children: { label: string; href: string }[];
}

const dropdownMenus: AdminMenuItem[] = [
  {
    key: "booking",
    label: "Booking",
    Icon: BsBook,
    children: [
      { label: "Booking List", href: "/admin/adminlistBookings" },
    ],
  },
  {
    key: "houses",
    label: "Houses",
    Icon: BsHouseAddFill,
    children: [
      { label: "Houses List", href: "/admin/adminlistHouses" },
    ],
  },
  {
    key: "accounts",
    label: "Accounts Bal.",
    Icon: BsCurrencyDollar,
    children: [
      {
        label: "All Accounts",
        href: "/admin/adminlistusersAccount",
      },
    ],
  },
  {
    key: "maintenance",
    label: "Maint.Req List",
    Icon: BsGearWideConnected,
    children: [
      {
        label: "Mant.Req List",
        href: "/admin/adminmaintenancereqlist",
      },
    ],
  },
  {
    key: "users",
    label: "Users",
    Icon: BsPersonPlusFill,
    children: [
      { label: "Create User", href: "/admin/admincreateuser" },
      { label: "Users List", href: "/admin/adminuserslist" },
    ],
  },
];

/* ============================================================
   TopAdminMenu
   ============================================================ */
export default function TopAdminMenu() {
  const baseUrl = environment.endpoint;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  /* 1. Role from Redux */
  const reduxRole = useAppSelector((state) => state.user.role);

  /* 2. localStorage fallback if Redux role is null */
  const localRole =
    typeof window !== "undefined"
      ? localStorage.getItem("userChoice")
      : null;

  const role = reduxRole || localRole;

  /* User info from Redux */
  const { name, isAuthenticated } = useAppSelector(
    (state) => state.user
  );

  /* localStorage token fallback for page refresh */
  const hasLocalToken =
    typeof window !== "undefined" && !!localStorage.getItem("token");
  const isUserAuthenticated = isAuthenticated || hasLocalToken;

  /* Admin image — hydrated from localStorage (mirrors TopTenantMenu) */
  const [adminImage, setAdminImage] = useState("None");

  useEffect(() => {
    const storedImage = localStorage.getItem("userImage");
    if (storedImage) setAdminImage(storedImage);
    setHasMounted(true);
  }, []);

  /* Guard: only show for authenticated Admins */
  if (!isUserAuthenticated || !role || role !== "Admin") {
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
        .join("") || "A"
    );
  };

  /* Active route helper */
  const isActive = (
    currentPathname: string | null,
    href: string
  ): boolean => {
    if (!currentPathname) return false;
    return (
      currentPathname === href ||
      currentPathname.startsWith(`${href}/`)
    );
  };

  /* Is any child of this dropdown currently active? */
  const isDropdownActive = (item: AdminMenuItem): boolean =>
    item.children.some((c) => isActive(pathname, c.href));

  const closeMenu = (): void => {
    setMenuOpen(false);
    setOpenDropdown(null);
  };

  const toggleDropdown = (key: string): void => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  /* Admin logout */
  const handleLogout = (): void => {
    dispatch(clearUser());
    setMenuOpen(false);
    setOpenDropdown(null);
    router.replace("/login");
  };

  return (
    <>
      <nav
        className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm"
        aria-label="Admin navigation"
      >
        <div className="container-fluid">
          {/* Admin Logo and Name */}
          <Link
            href="/admin/admindashboard"
            className="navbar-brand d-flex align-items-center gap-2"
            onClick={closeMenu}
          >
            {adminImage && adminImage !== "None" ? (
              <img
                src={`${baseUrl}/${adminImage}`}
                alt="Admin"
                width={42}
                height={42}
                style={{ objectFit: "cover", borderRadius: "5px" }}
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
              {name || "Admin"}
            </span>
          </Link>

          {/* Mobile toggle */}
          <button
            className="navbar-toggler"
            type="button"
            aria-label="Toggle navigation"
            aria-controls="adminNavbar"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? <BsX size={26} /> : <BsList size={26} />}
          </button>

          {/* Navigation Items */}
          <div
            id="adminNavbar"
            className={`collapse navbar-collapse ${
              menuOpen ? "show" : ""
            }`}
          >
            <ul className="navbar-nav me-auto ms-lg-5 gap-lg-3">
              {dropdownMenus.map((item) => {
                const Icon = item.Icon;
                const open = openDropdown === item.key;
                const active = isDropdownActive(item);

                return (
                  <li className="nav-item dropdown" key={item.key}>
                    <button
                      type="button"
                      className={`nav-link dropdown-toggle d-flex align-items-center gap-2 px-3 border-0 bg-transparent ${
                        active
                          ? "active fw-bold text-white"
                          : "text-white"
                      }`}
                      aria-haspopup="true"
                      aria-expanded={open}
                      onClick={() => toggleDropdown(item.key)}
                    >
                      <Icon size={18} />
                      {item.label}
                      <BsChevronDown size={12} />
                    </button>

                    <ul
                      className={`dropdown-menu ${open ? "show" : ""}`}
                      style={{ background: "rgb(175, 171, 167)" }}
                    >
                      {item.children.map((child) => {
                        const childActive = isActive(pathname, child.href);
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`dropdown-item ${
                                childActive
                                  ? "active fw-bold"
                                  : ""
                              }`}
                              style={{
                                color: "rgb(35, 66, 124)",
                                textAlign: "center",
                              }}
                              aria-current={
                                childActive ? "page" : undefined
                              }
                              onClick={closeMenu}
                            >
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>

            {/* Admin Logout */}
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