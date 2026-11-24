'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useRegisterUserMutation } from '@/store/api/authApi';
import './register.component.css';

export default function RegisterComponent() {
  const router = useRouter();
  const [registerUser, { isLoading }] = useRegisterUserMutation();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onChange',
  });

  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');

  const changeImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const goBack = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/login');
  };

  const onRegister = async (data: any) => {
    if (passwordValue !== confirmPasswordValue) {
      alert('Password mismatch');
      return;
    }

    try {
      const userChoice = typeof window !== 'undefined' ? localStorage.getItem('userChoice') || 'Tenant' : 'Tenant';

      alert(`Im in register component - line 50 - User Choice: ${userChoice}`); // Debugging alert
      

      await registerUser({
        postData: {
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          ide: data.ide,
          phoneNumber: data.phoneNumber,
        },
        selectedFile,
        userChoice,
      }).unwrap();

      alert('Registration successful! Please log in.');
      router.push('/login');
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="container main" style={{ padding: '4em' }}>
      <div className="window rounded-3">
        <div className="row windowsSSheight">
          {/* Column for Image */}
          <div className="col-md-5" style={{ margin: '1em' }}>
            <img
              className="img-fluid rounded-3"
              src="/images/mainownerpage/ownerimage01.png"
              alt="Rent House Register"
            />
          </div>

          {/* Column for Register Form */}
          <div className="col-md-6">
            <div className="logo header-register">
              <div className="col-md-12" style={{ marginTop: '2em' }}>
                <span className="nav_logo-name" style={{ color: '#fafbfc' }}>
                  House Rental System
                </span>
              </div>
              <div>
                <img src="/images/logo/rental-logo03.png" width="50" alt="system-logo" />
                &nbsp;&nbsp;
                <span className="nav_logo-name" style={{ color: '#fafbfc' }}>SerRental</span>
                <span className="nav_logo-name" style={{ color: '#fafbfc', fontSize: '1rem', position: 'relative', top: '-5px', left: '5px' }}>App</span>
              </div>
              <div>
                <h2 style={{ color: '#fafbfc', marginBottom: '1em' }}>Register</h2>
              </div>
            </div>

            <div className="col-lg-16 input-group-block">
              <form onSubmit={handleSubmit(onRegister)} autoComplete="off">
                {/* Fullname Input */}
                <div className="mb-3 row-input-line">
                  <label htmlFor="fullName" className="form-label">
                    👤 &nbsp; Username:
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="fullName"
                    placeholder="Please, Enter your Username"
                    {...register('fullName', { required: true })}
                  />
                </div>
                {errors.fullName && (
                  <div className="form-error show-error-input">
                    <span className="text-danger">Username is required*</span>
                  </div>
                )}

                {/* Email Input */}
                <div className="mb-3 row-input-line">
                  <label htmlFor="email" className="form-label">
                    ✉ &nbsp; Email:
                  </label>
                  <input
                    type="email"
                    className="form-control input"
                    id="email"
                    placeholder="Please, Enter your Email"
                    {...register('email', { required: true })}
                  />
                </div>
                {errors.email && (
                  <div className="form-error show-error-input">
                    <span className="text-danger">Email is required*</span>
                  </div>
                )}

                {/* ID Input */}
                <div className="mb-3 row-input-line">
                  <label htmlFor="ide" className="form-label">
                    🪪 &nbsp; Id:
                  </label>
                  <input
                    type="text"
                    className="form-control input"
                    id="ide"
                    placeholder="Please, Enter your Id"
                    {...register('ide', { required: true })}
                  />
                </div>
                {errors.ide && (
                  <div className="form-error show-error-input">
                    <span className="text-danger">Your Id is required*</span>
                  </div>
                )}

                {/* Phone Number Input */}
                <div className="mb-3 row-input-line">
                  <label htmlFor="phoneNumber" className="form-label">
                    📞 &nbsp; Phone #:
                  </label>
                  <input
                    type="text"
                    className="form-control input"
                    id="phoneNumber"
                    placeholder="Please, Enter your Phone #"
                    {...register('phoneNumber', { required: true })}
                  />
                </div>
                {errors.phoneNumber && (
                  <div className="form-error show-error-input">
                    <span className="text-danger">Your Phone # is required*</span>
                  </div>
                )}

                {/* Password Input */}
                <div className="mb-3 row-input-line">
                  <label htmlFor="password" className="form-label">
                    🔑 &nbsp; Password:
                  </label>
                  <input
                    type="password"
                    className="form-control input"
                    id="password"
                    placeholder="Enter Password"
                    {...register('password', { required: true })}
                  />
                </div>
                {errors.password && (
                  <div className="form-error show-error-input">
                    <span className="text-danger">Password is required*</span>
                  </div>
                )}

                {/* Confirm Password Input */}
                <div className="mb-3 row-input-line">
                  <label htmlFor="confirmPassword" className="form-label">
                    🔑 &nbsp; Confirm Password:
                  </label>
                  <input
                    type="password"
                    className="form-control input"
                    id="confirmPassword"
                    placeholder="Confirm Password"
                    {...register('confirmPassword', { required: true })}
                  />
                </div>
                {errors.confirmPassword && (
                  <div className="form-error show-error-input">
                    <span className="text-danger">Confirm Password required*</span>
                  </div>
                )}

                {passwordValue && confirmPasswordValue && passwordValue !== confirmPasswordValue && (
                  <div className="form-error show-error-input">
                    <span className="text-danger">Password mismatch*</span>
                  </div>
                )}

                {/* User Image Section */}
                <div className="mb-3 row-input-line" style={{ marginBottom: '2em', marginTop: '3em' }}>
                  <label htmlFor="image" className="control-label" style={{ color: 'aliceblue', fontWeight: 'bold' }}>
                    Add User Picture:
                  </label>
                  <input
                    id="image"
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={changeImg}
                  />
                  <div className="file-custom">
                    {imagePreviewUrl && <img src={imagePreviewUrl} alt="Preview" className="imagePreviewSelected" />}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex flex-row justify-content-lg-around">
                  <div className="text-center" style={{ marginTop: '1em' }}>
                    <button
                      type="submit"
                      className="btn btn-primary w-100 mt-3 btnRegister"
                      id="btnRegister"
                      disabled={!isValid || isLoading || passwordValue !== confirmPasswordValue}
                    >
                      {isLoading ? 'Registering...' : 'Register'}
                    </button>
                  </div>
                  <div className="text-center" style={{ marginTop: '1em' }}>
                    <button type="button" className="btn w-100 mt-3 btnGoBack" id="btnBack" onClick={goBack}>
                      Back
                    </button>
                  </div>
                </div>

                <br /><br /><br />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}