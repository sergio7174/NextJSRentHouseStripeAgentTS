'use client';

import { useState } from 'react';
import { useRegisterUserMutation } from '@/store/api/authApi';
import styles from './admincreateuser.module.css';
import TopAdminMenu from "../../layouts/topmenu/admin/TopAdminMenu";
import Footer from "../../layouts/footer/footer";

/* ============================================================
   Role enum
   ============================================================ */
type UserRole = 'Admin' | 'Owner' | 'Tenant';

const ROLE_OPTIONS: UserRole[] = ['Admin', 'Owner', 'Tenant'];

/* ============================================================
   Form shape
   ============================================================ */
interface UserFormState {
  fullName: string;
  email: string;
  ide: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
}

const emptyForm: UserFormState = {
  fullName: '',
  email: '',
  ide: '',
  password: '',
  phoneNumber: '',
  role: 'Admin',
};

/* ============================================================
   Validation helpers
   ============================================================ */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IDE_RE = /^[a-zA-Z0-9_-]{5,15}$/;
const PHONE_RE = /^[0-9+\s-]{7,15}$/;

/* ============================================================
   Admincreateuser
   ============================================================ */
export default function Admincreateuser() {
  /* ---------- RTK Query mutation ---------- */
  const [registerUser, { isLoading: isSubmitting }] = useRegisterUserMutation();

  /* ---------- Form + touched state ---------- */
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /* ---------- File + preview ---------- */
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  /* ---------- Toast ---------- */
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  /* ---------- Validation ---------- */
  const isFullNameInvalid = form.fullName.trim().length < 3;
  const isEmailInvalid = !EMAIL_RE.test(form.email.trim());
  const isIdeInvalid = !IDE_RE.test(form.ide.trim());
  const isPasswordInvalid = form.password.length < 6;
  const isPhoneInvalid = !PHONE_RE.test(form.phoneNumber.trim());
  const isRoleInvalid = !ROLE_OPTIONS.includes(form.role);
  const isImageInvalid = !selectedFile;

  const isFormInvalid =
    isFullNameInvalid ||
    isEmailInvalid ||
    isIdeInvalid ||
    isPasswordInvalid ||
    isPhoneInvalid ||
    isRoleInvalid ||
    isImageInvalid;

  /* ---------- Handlers ---------- */
  const onFieldChange =
    (field: keyof Omit<UserFormState, 'role'>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const onRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, role: e.target.value as UserRole }));
  };

  const onBlur = (field: string) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({
        type: 'error',
        text: 'Invalid file format. Please upload a valid image element.',
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submitUserForm = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      fullName: true,
      email: true,
      ide: true,
      password: true,
      phoneNumber: true,
      role: true,
      image: true,
    });

    if (isFormInvalid || !selectedFile) {
      setToast({
        type: 'warning',
        text: 'Please resolve outstanding validation flags before database submission.',
      });
      return;
    }

    try {
      await registerUser({
        postData: {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          ide: form.ide,
          phoneNumber: form.phoneNumber,
          role: form.role, // ← informative; authApi reads `userChoice`
        },
        selectedFile,
        userChoice: form.role, // ← actual `role` field sent to the backend
      }).unwrap();

      setToast({
        type: 'success',
        text: `${form.role} System User document successfully recorded in MongoDB.`,
      });

      // Reset — but keep the last chosen role as the new default
      setForm({ ...emptyForm, role: form.role });
      setTouched({});
      setSelectedFile(null);
      setImagePreview(null);
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err?.data?.message ?? 'Database execution exception encountered.',
      });
    }
  };

  /* ---------- Render ---------- */
  return (
    <>
    <TopAdminMenu/>
    <div className={styles.formViewportWrapper}>
      <div className={styles.outerGlassContainer}>
        <header className={styles.componentMainHeader}>
          <h1>Create User Form</h1>
        </header>

        {/* Toast */}
        {toast && (
          <div
            className={`${styles.toastBanner} ${
              toast.type === 'success'
                ? styles.toastSuccess
                : toast.type === 'warning'
                ? styles.toastWarning
                : styles.toastError
            }`}
          >
            {toast.text}
          </div>
        )}

        <main className={styles.splitPaneWorkspace}>
          {/* ---- Form pane ---- */}
          <section className={`${styles.paneElement} ${styles.formWorkspacePane}`}>
            <form onSubmit={submitUserForm} noValidate>
              {/* Full name */}
              <div className={styles.formInputGroup}>
                <label htmlFor="fullName">Full Professional Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={onFieldChange('fullName')}
                  onBlur={onBlur('fullName')}
                  placeholder="Ex: Alex Vance"
                  className={
                    touched.fullName && isFullNameInvalid ? styles.inputErrorState : ''
                  }
                />
                {touched.fullName && isFullNameInvalid && (
                  <div className={styles.errorFeedbackMsg}>
                    Full name parameter validation requires a minimum length threshold of 3 letters.
                  </div>
                )}
              </div>

              {/* Email */}
              <div className={styles.formInputGroup}>
                <label htmlFor="email">Corporate Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={onFieldChange('email')}
                  onBlur={onBlur('email')}
                  placeholder="alex.vance@rentcontrol.com"
                  className={
                    touched.email && isEmailInvalid ? styles.inputErrorState : ''
                  }
                />
                {touched.email && isEmailInvalid && (
                  <div className={styles.errorFeedbackMsg}>
                    Please declare a structurally valid unique email coordinate mapping index.
                  </div>
                )}
              </div>

              {/* IDE */}
              <div className={styles.formInputGroup}>
                <label htmlFor="ide">System User Identification (IDE)</label>
                <input
                  id="ide"
                  type="text"
                  value={form.ide}
                  onChange={onFieldChange('ide')}
                  onBlur={onBlur('ide')}
                  placeholder="Ex: ADM-90210"
                  className={
                    touched.ide && isIdeInvalid ? styles.inputErrorState : ''
                  }
                />
                {touched.ide && isIdeInvalid && (
                  <div className={styles.errorFeedbackMsg}>
                    IDE token string field identification requires an alphanumeric context pattern map.
                  </div>
                )}
              </div>

              {/* Password */}
              <div className={styles.formInputGroup}>
                <label htmlFor="password">Cryptographic Account Password</label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={onFieldChange('password')}
                  onBlur={onBlur('password')}
                  placeholder="••••••••••••"
                  className={
                    touched.password && isPasswordInvalid
                      ? styles.inputErrorState
                      : ''
                  }
                />
                {touched.password && isPasswordInvalid && (
                  <div className={styles.errorFeedbackMsg}>
                    Password elements mandate a core security composition baseline of 6 character items minimum.
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className={styles.formInputGroup}>
                <label htmlFor="phoneNumber">Direct Telephone Coordinates</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={onFieldChange('phoneNumber')}
                  onBlur={onBlur('phoneNumber')}
                  placeholder="+1 (555) 019-2834"
                  className={
                    touched.phoneNumber && isPhoneInvalid
                      ? styles.inputErrorState
                      : ''
                  }
                />
                {touched.phoneNumber && isPhoneInvalid && (
                  <div className={styles.errorFeedbackMsg}>
                    Provide an explicitly complete numeric context target phone string routing mapping.
                  </div>
                )}
              </div>

              {/* Role (NEW) */}
              <div className={styles.formInputGroup}>
                <label htmlFor="role">System Authorization Role</label>
                <select
                  id="role"
                  value={form.role}
                  onChange={onRoleChange}
                  onBlur={onBlur('role')}
                  className={
                    touched.role && isRoleInvalid ? styles.inputErrorState : ''
                  }
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {touched.role && isRoleInvalid && (
                  <div className={styles.errorFeedbackMsg}>
                    Select one of the supported roles: Admin, Owner, or Tenant.
                  </div>
                )}
              </div>

              {/* Image file */}
              <div className={`${styles.formInputGroup} ${styles.imageUploadGroup}`}>
                <label>Profile Avatar Branding Picture Asset</label>
                <div
                  className={`${styles.customFileUploader} ${
                    touched.image && isImageInvalid ? styles.uploaderErrorState : ''
                  }`}
                >
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    onChange={onFileSelected}
                    onBlur={onBlur('image')}
                  />
                  <label htmlFor="imageUpload" className={styles.uploaderTriggerLabel}>
                    <span className={styles.uploadIcon}>📷</span>
                    {selectedFile?.name || 'Select Profile Image Element Asset'}
                  </label>
                </div>

                {imagePreview && (
                  <div className={styles.microPreviewViewport}>
                    <img src={imagePreview} alt="Admin Identity Preview Graphic Layer" />
                    <span className={styles.previewTag}>Live Preview Token</span>
                  </div>
                )}

                {touched.image && isImageInvalid && (
                  <div className={styles.errorFeedbackMsg}>
                    Uploading a reference target identity graphics asset file element is required.
                  </div>
                )}
              </div>

              <div className={styles.formSubmitRow}>
                <button
                  type="submit"
                  className={styles.btnDashboardSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Writing MongoDB Assets Cluster Pipeline...'
                    : `Commit ${form.role} User Entry Document`}
                </button>
              </div>
            </form>
          </section>

          {/* ---- Visual sidebar ---- */}
          <section className={`${styles.paneElement} ${styles.graphicPresentationSidebar}`}>
            <div className={styles.sidebarTextOverlay}>
              <h3>Administrative Console Identity Allocation Engine</h3>
              <p>
                System credentials committed inside this container partition are
                globally initialized with structural high-level{' '}
                <strong>{form.role}</strong> authorization role constraints
                across target modules automatically.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
   <Footer/>
  </>  
  );
}