'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch } from '@/store/hooks';
import { setUser, UserRole } from '@/store/slices/userSlice';
import './mainpage.component.css';
import Footer from '@/components/layouts/footer/footer';

export default function MainPage() {

  const router = useRouter();
  const dispatch = useAppDispatch();

  // Helper handler to store the chosen role/choice and navigate to login
  const handleRoleSelection = (role: UserRole) => {
    // Optionally update Redux state or local storage with the intended role/choice
    dispatch(
      setUser({
        id: '',
        name: '',
        email: '',
        role, // Temporarily store the intended role
      })
    );
    
    // In your original Angular app, choices/roles were stored in local storage
    if (typeof window !== 'undefined') {
      localStorage.setItem('userChoice', role || 'None');
      localStorage.setItem('userRole', role || 'guest');
    }

    // Redirect to the login page as originally designed
    router.push('/login');
  };

  return (
    <>
    <section className="hero">
      <div className="overlay"></div>

      {/* Bootstrap 5 Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light">
        <div className="container-fluid px-0">
          <a className="navbar-brand logo" href="#">
            RentControl Premium
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
            <ul className="navbar-nav gap-4">
              <li className="nav-item">
                <a className="nav-link active" href="#">
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  Properties
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  About
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Content Grid */}
      <div className="content">
        <div className="left">
          <div className="badge text-dark">• THE STANDARD IN ASSET MANAGEMENT</div>
          <h1>
            Gestión Inmobiliaria<br />
            de Próxima<br />
            <span>Generación.</span>
          </h1>
          <p>
            Optimice sus activos, automatice arrendamientos y controle sus finanzas con la
            plataforma preferida por los líderes del sector de lujo.
          </p>
        </div>

        <div className="right">
          <div className="glass-panel">
            {/* Admin Access Card -> Goes to Login */}
            <div
              role="button"
              tabIndex={0}
              className="card border-0"
              onClick={() => handleRoleSelection('Admin')}
              onKeyDown={(e) => e.key === 'Enter' && handleRoleSelection('Admin')}
            >
              <div className="icon">☎</div>
              <div className="text">
                <h3>Admin Access</h3>
                <p>Gestión de portafolio y analítica avanzada</p>
              </div>
              <div className="arrow">→</div>
            </div>

            {/* Owner Access Card -> Goes to Login */}
            <div
              role="button"
              tabIndex={0}
              className="card border-0"
              onClick={() => handleRoleSelection('Owner')}
              onKeyDown={(e) => e.key === 'Enter' && handleRoleSelection('Owner')}
            >
              <div className="icon">⌂</div>
              <div className="text">
                <h3>Owner Access</h3>
                <p>Seguimiento de rentabilidad y contratos</p>
              </div>
              <div className="arrow">→</div>
            </div>

            {/* Tenant Access Card -> Goes to Login */}
            <div
              role="button"
              tabIndex={0}
              className="card border-0"
              onClick={() => handleRoleSelection('Tenant')}
              onKeyDown={(e) => e.key === 'Enter' && handleRoleSelection('Tenant')}
            >
              <div className="icon">🔑</div>
              <div className="text">
                <h3>Tenant Access</h3>
                <p>Pagos, servicios y mantenimiento</p>
              </div>
              <div className="arrow">→</div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <Footer />
   </> 
  );
}