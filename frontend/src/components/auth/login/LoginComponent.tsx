// nexthouserenting/src/components/auth/login/LoginComponent.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/userSlice';
import { useLoginMutation, useGetOneAdminQuery } from '@/store/api/authApi';
import './login.component.css';
import { notifyError, notifySuccess } from '@/utils/toast';


export default function LoginComponent() {

  const dispatch = useAppDispatch();
  const [loginApi, { isLoading }] = useLoginMutation();

  const [optionSelected, setOptionSelected] = useState<string>('Guest');
  const [haveAdmin, setHaveAdmin] = useState<string>('NoAdmin');
  const router = useRouter();
 
 

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onChange',
  });

  // Check if Admin exists in backend if role/choice is Admin
  //const { data: response } = useGetOneAdminQuery(undefined, {
    /*skip: optionSelected.toLowerCase() !== 'Admin',*/
  //}
//);

// RTK Query hook

  const { data: response , error } = useGetOneAdminQuery(undefined);

  // Read selected role/choice from localStorage and evaluate admin status on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      //alert(`Im in login component - line 43 - User Choice: ${localStorage.getItem('userChoice')}`); // Debugging alert

      const storedChoice = localStorage.getItem('userChoice') || 'Guest';
      //alert(`Im in login component - line 46 - Stored Choice: ${storedChoice}`); // Debugging alert
      setOptionSelected(storedChoice);
      //alert(`Im in login component - line 48 - storedChoice.toLowerCase(): ${storedChoice}`); // Debugging alert
      if (storedChoice === 'Admin') {
        //alert(`Im in login component - line 50 - Admin Check Data: ${JSON.stringify(response?.data)}`); // Debugging alert
        // If backend query returns that an admin exists, set haveAdmin accordingly
        if (response?.data > 0 || response === true) {
          setHaveAdmin('HasAdmin');
        } else {
          setHaveAdmin('NoAdmin');
        }
      } else {
        setHaveAdmin('NoAdmin');
      }
    }
  }, [response]);

  const onSubmit = async (data: any) => {
    try {
      const response: any = await loginApi({
        email: data.email,
        password: data.password,
      }).unwrap();

      if (typeof window !== 'undefined' && response?.token) {
        notifySuccess("Login successfully");
        localStorage.setItem('token', response.token);
        // Make sure you save the name here!
        // alert("Im at login component - line 73 - response.user: "+ response?.user)
        // alert("Im at login component - line 79 - response.user.image: "+ response?.user?.image)
        localStorage.setItem('userName', response?.user?.fullName );
        localStorage.setItem('userId', response?.user?._id || '');
        localStorage.setItem('userEmail', response?.user?.email || data.email);
        localStorage.setItem('userImage', response?.user?.image );

        dispatch(
        setUser({
          id: response?.user?._id || 'user-1',
          name: response?.user?.fullName || 'User',
          email: response?.user?.email || data.email,
          role: response?.user?.role ,
          userImage: response?.user?.image
        })
      );

      const role = response?.user?.role;
      if (role === 'Admin') {
        router.push('admin/admindashboard');
      } else if (role === 'Owner') {
        router.push('owner/ownerdashboard');
      } else {
        router.push('tenant/tenantdashboard');
      }

      }else {

          //alert("Line 104 - login component - Something go wrong ...!"+response?.message)
          notifyError("Login failed. Please check your credentials.")
          router.push("login");
        }

      
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="container-fluid h-100 p-0">
      <div className="row h-100 g-0">
        {/* Left Side: Login Form */}
        <div className="col-lg-5 d-flex align-items-center justify-content-center bg-color form-side">
          <div className="w-75 bg-color-form m-2 p-2">
            <div className="mt-2" id="notamember">
              &nbsp; &nbsp;{' '}
              <Link href="/" style={{ color: 'crimson', fontWeight: 'bold' }} id="gobackr">
                Back?
              </Link>
            </div>
            <div className="d-flex flex-row justify-content-center align-items-center mt-3">
              <strong>RentControl &nbsp;&nbsp;</strong>
              <img
                className="img-fluid rounded-3"
                src="/images/mainownerpage/ownerimage01.png"
                alt="Owner-login-image"
                style={{ width: '90px', height: '90px' }}
              />
            </div>

            <div className="d-flex flex-column justify-content-center align-items-center text-center">
              <h2 className="fw-bold">Welcome Back {optionSelected}</h2>
              <h6 className="text-muted">Enter your credentials to manage your premium assets.</h6>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
              {/* Email block */}
              <div className="mb-3">
                <label className="form-label">✉ &nbsp; Email Address</label>
                <input
                  type="email"
                  className="form-control py-3"
                  id="email"
                  placeholder="alex.sterling@corporate.com"
                  {...register('email', { required: 'Email is required*' })}
                />
                {errors.email && (
                  <div className="form-error">
                    <span className="text-danger">{String(errors.email.message)}</span>
                  </div>
                )}
              </div>

              {/* Password block */}
              <div className="mb-3 password-block">
                <div className="d-flex justify-content-between">
                  <label htmlFor="password" className="form-label">
                    🔑 &nbsp; Password
                  </label>
                  <a href="#" className="text-decoration-none">
                    Forgot password?
                  </a>
                </div>

                <input
                  type="password"
                  className="form-control py-3 noBorder"
                  id="password"
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required*' })}
                />
                {errors.password && (
                  <div className="form-error">
                    <span className="text-danger">{String(errors.password.message)}</span>
                  </div>
                )}
              </div>

              {/* Conditional check matching original Angular logic for admin backend verification */}
              {haveAdmin === 'NoAdmin' && (
                <div className="mt-2" id="notamember">
                  Not Account? &nbsp; &nbsp;{' '}
                  <Link href="/register" style={{ color: 'crimson', fontWeight: 'bold' }} id="goregister">
                    Register
                  </Link>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-100 py-3 rounded-3 mt-3"
                id="btnLogin"
                disabled={!isValid || isLoading}
              >
                {isLoading ? 'Signing In...' : 'Secure Sign In'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Background + Testimonial Card */}
        <div className="col-lg-7 d-flex align-items-center justify-content-center bg-image-side">
          <div className="testimonial-card p-4 rounded-4 shadow-lg text-white">
            <p className="fs-4">
              &quot;RentControl has redefined how we monitor our global luxury portfolio. The clarity is unparalleled.&quot;
            </p>
            <div className="d-flex align-items-center mt-3">
              <div className="rounded-circle bg-secondary me-3" style={{ width: '50px', height: '50px' }}></div>
              <div>
                <strong className="d-block">Julian Vane</strong>
                <small>Director of Operations, Vane Estates</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}