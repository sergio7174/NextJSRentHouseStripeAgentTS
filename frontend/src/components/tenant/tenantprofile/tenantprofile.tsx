'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/store/hooks';

// ---- API slice (userApi.ts) ----
import {
  useGetUserByIdQuery,
  useUpdateUserOldImageMutation,
  useUpdateUserNewImageMutation,
  useDeleteUserImageMutation,
  usePutUpdatePasswordMutation,
} from '@/store/api/userApi';

import { environment } from '@/environments/environments';
import styles from './tenantprofile.module.css';
import TopTenantMenu from "../../layouts/topmenu/tenant/TopTenantMenu";
import Footer from "../../layouts/footer/footer";

/* ============================================================
   Local config
   ============================================================ */
const BASE_URL = environment.endpointI;

/* ============================================================
   Tenantprofile
   - Profile form (fullName, email, ide, phoneNumber + image)
   - Password change form
   - Image preview via FileReader
   ============================================================ */
export default function Tenantprofile() {
  /* ---------- User from the store ---------- */
  const tenant = useAppSelector((state) => state.user);
  const userId: string = tenant?.id ?? '';
  const userRole: string = tenant?.role ?? '';

  /* ---------- RTK Query: fetch user ---------- */
  const {
    data: userData,
    isLoading: isLoadingProfile,
  } = useGetUserByIdQuery(userId, { skip: !userId });

  /* ---------- Mutations ---------- */
  const [updateUserOldImage, { isLoading: savingOldImage }] =
    useUpdateUserOldImageMutation();
  const [updateUserNewImage, { isLoading: savingNewImage }] =
    useUpdateUserNewImageMutation();
  const [deleteUserImage] = useDeleteUserImageMutation();
  const [putUpdatePassword, { isLoading: savingPassword }] =
    usePutUpdatePasswordMutation();

  /* ---------- Form state ---------- */
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    ide: '',
    phoneNumber: '',
  });

  const [password, setPassword] = useState<string>('');

  /* ---------- Image state ---------- */
  const [oldImagePreview, setOldImagePreview] = useState<string | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------- Hydrate form when data arrives ---------- */
  useEffect(() => {
    if (!userData) return;
    setOldImagePreview(userData.image ?? null);
    setProfileForm({
      fullName: userData.fullName ?? '',
      email: userData.email ?? '',
      ide: userData.ide ?? '',
      phoneNumber: userData.phoneNumber ?? '',
    });
  }, [userData]);

  /* ---------- Local toast (was ToastrService) ---------- */
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- File selection (mirrors onFileSelected) ---------- */
  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewImagePreview((e.target?.result as string) ?? null);
      };
      reader.readAsDataURL(file);
    } else {
      setNewImagePreview(null);
    }
  };

  /* ---------- Handlers ---------- */
  const onProfileChange = (field: keyof typeof profileForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfileForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileForm.fullName || !profileForm.email || !profileForm.ide) {
      setToast({
        type: 'error',
        text: 'Full name, email and ID are required.',
      });
      return;
    }

    try {
      if (!selectedFile) {
        // ---- Path A: keep old image ----
        await updateUserOldImage({
          userId,
          postData: {
            fullName: profileForm.fullName,
            email: profileForm.email,
            ide: profileForm.ide,
            phoneNumber: profileForm.phoneNumber,
            password: '',
          },
          Oldimage: oldImagePreview ?? '',
          UserRole: userRole,
        }).unwrap();

        setToast({ type: 'success', text: 'Profile updated successfully' });
        setProfileForm({ fullName: '', email: '', ide: '', phoneNumber: '' });
      } else {
        // ---- Path B: new image → delete old one first, then upload new ----
        if (oldImagePreview) {
          try {
            await deleteUserImage({ image: oldImagePreview }).unwrap();
            setToast({ type: 'success', text: 'Image deleted successfully' });
          } catch {
            setToast({ type: 'error', text: 'Image delete failed .......' });
          }
        }

        await updateUserNewImage({
          userId,
          postData: {
            fullName: profileForm.fullName,
            email: profileForm.email,
            ide: profileForm.ide,
            phoneNumber: profileForm.phoneNumber,
            password: '',
          },
          selectedFile,
          UserRole: userRole,
        }).unwrap();

        setToast({ type: 'success', text: 'Profile updated successfully' });

        // Reset form + previews
        setProfileForm({ fullName: '', email: '', ide: '', phoneNumber: '' });
        setSelectedFile(null);
        setNewImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err?.data?.message ?? err?.error ?? 'Update failed .......',
      });
    }
  };

  const savePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    try {
      await putUpdatePassword({ id: userId, password }).unwrap();
      setToast({ type: 'success', text: 'Password updated successfully' });
      setPassword('');
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err?.data?.message ?? err?.error ?? 'Update failed .......',
      });
    }
  };

  /* ---------- Render ---------- */
  return (
    <>
   <TopTenantMenu/>
    <div className={styles.profileWrapper}>
      {/* Toast */}
      {toast && (
        <div
          className={`${styles.toastBanner} ${
            toast.type === 'success' ? styles.toastSuccess : styles.toastError
          }`}
        >
          {toast.text}
        </div>
      )}

      <header className={styles.headerContainer}>
        <h1 className={styles.pageTitle}>Tenant Profile View</h1>
        <div className={styles.userPreview}>
          {oldImagePreview && (
            <img
              src={`${BASE_URL}${oldImagePreview}`}
              alt="Current"
              className={styles.profileThumb}
            />
          )}
          <span>Current Photo</span>
        </div>
      </header>

      <main className={styles.profileContent}>
        <form onSubmit={saveProfile} className={styles.profileForm}>
          <div className={styles.formGrid}>
            <input
              value={profileForm.fullName}
              onChange={onProfileChange('fullName')}
              placeholder="Full Name"
              required
            />
            <input
              type="email"
              value={profileForm.email}
              onChange={onProfileChange('email')}
              placeholder="Email"
              required
            />
            <input
              value={profileForm.ide}
              onChange={onProfileChange('ide')}
              placeholder="ID"
              required
            />
            <input
              value={profileForm.phoneNumber}
              onChange={onProfileChange('phoneNumber')}
              placeholder="Phone"
            />
            <input
              ref={fileInputRef}
              type="file"
              onChange={onFileSelected}
            />
          </div>

          <div className={styles.previewBox}>
            {newImagePreview && (
              <img
                src={newImagePreview}
                alt="New preview"
                className={styles.newThumb}
              />
            )}
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.btnSave}
              disabled={savingOldImage || savingNewImage}
            >
              {savingOldImage || savingNewImage ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>

        <div className={styles.houseVisual} />
      </main>

      <br />
      <br />

      <section className={styles.profileContent}>
        <form onSubmit={savePasswordChange} className={styles.passwordForm}>
          <div className={styles.formGrid}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New Password"
            />
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={`${styles.btnSave} ${styles.btnPass}`}
              disabled={savingPassword}
            >
              {savingPassword ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </form>
        <div className={styles.houseVisual} />
      </section>
    </div>
    <Footer/>
    </>
  );
}