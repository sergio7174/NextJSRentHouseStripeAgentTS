'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';

// ---- API slice (houseApi.ts) ----
import { useCreateHouseMutation } from '@/store/api/houseApi';

import styles from './ownercreatehouse.module.css';
import TopOwnerMenu from "../../../layouts/topmenu/owner/TopOwnerMenu";
import Footer from "../../../layouts/footer/footer";

/* ============================================================
   Local config
   ============================================================ */
const MAIN_TITLE = 'Create House Form';
const DEFAULT_VISUAL =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

/* ============================================================
   Form shape (was FormBuilder group)
   ============================================================ */
interface HouseFormState {
  houseCode: string;
  description: string;
  pincode: string;
  state: string;
  city: string;
  street: string;
  landmark: string;
  totalRooms: number;
  RentPrice: number;
  legalDocuments: string;
}

const emptyForm: HouseFormState = {
  houseCode: '',
  description: '',
  pincode: '',
  state: '',
  city: '',
  street: '',
  landmark: '',
  totalRooms: 0,
  RentPrice: 0,
  legalDocuments: '',
};

/* ============================================================
   Ownercreatehouse
   ============================================================ */
export default function Ownercreatehouse() {
  const router = useRouter();

  /* ---------- Owner info from the store ---------- */
  const owner = useAppSelector((state) => state.user);
  const ownerId: string = owner?.id ?? '';
  const ownerName: string = owner?.name ?? '';
  const ownerEmail: string = owner?.email ?? '';

  /* ---------- RTK Query: create-house mutation ---------- */
  const [createHouse, { isLoading: isSubmitting }] = useCreateHouseMutation();

  /* ---------- Form state ---------- */
  const [form, setForm] = useState<HouseFormState>(emptyForm);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /* ---------- File + preview state ---------- */
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Ref used to revoke the object URL whenever it's replaced or cleared
  const objectUrlRef = useRef<string | null>(null);
  // Ref so we can reset <input type="file"> programmatically
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------- UI feedback ---------- */
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* ---------- Visual fallback if image fails ---------- */
  const [visualImage, setVisualImage] = useState(
    'assets/images/modern-house-render.jpg'
  );

  /* ---------- Revoke blob URL on unmount ---------- */
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  /* ---------- Validation helpers ---------- */
  const isHouseCodeInvalid = form.houseCode.trim().length < 3;
  const isRentPriceInvalid = form.RentPrice <= 0;
  const isImageInvalid = !selectedFile;
  const isPincodeInvalid = !/^[0-9]+$/.test(form.pincode.trim());
  const isDescriptionInvalid = form.description.trim().length === 0;
  const isTotalRoomsInvalid = form.totalRooms < 1;

  const isFormInvalid =
    isHouseCodeInvalid ||
    isRentPriceInvalid ||
    isImageInvalid ||
    isPincodeInvalid ||
    isDescriptionInvalid ||
    isTotalRoomsInvalid ||
    !form.state.trim() ||
    !form.city.trim() ||
    !form.street.trim();

  /* ---------- Handlers ---------- */
  const onFieldChange =
    (field: keyof HouseFormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const raw = e.target.value;
      setForm((prev) => ({
        ...prev,
        [field]:
          field === 'totalRooms' || field === 'RentPrice'
            ? Number(raw) || 0
            : raw,
      }));
    };

  const onBlur = (field: string) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  /* ---------- File select + preview ---------- */
  const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setSelectedFileName(file?.name ?? '');

    // Release the previous preview URL before creating a new one
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  /* ---------- Clear image (preview + file + input) ---------- */
  const onClearImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImagePreview(null);
    setSelectedFile(null);
    setSelectedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Mark image as touched so the "required" message reappears
    setTouched((prev) => ({ ...prev, image: true }));
  };

  /* ---------- Back to Owner Dashboard ---------- */
  const goBackToOwnerDashboard = () => {
    router.push('/owner/ownerdashboard');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    setTouched({
      houseCode: true,
      description: true,
      pincode: true,
      state: true,
      city: true,
      street: true,
      totalRooms: true,
      RentPrice: true,
      image: true,
    });

    if (isFormInvalid || !selectedFile) return;

    try {
      const response = await createHouse({
        payload: {
          houseCode: form.houseCode,
          description: form.description,
          pincode: form.pincode,
          state: form.state,
          city: form.city,
          street: form.street,
          landmark: form.landmark,
          totalRooms: form.totalRooms,
          RentPrice: form.RentPrice,
          legalDocuments: form.legalDocuments,
        },
        selectedFile,
        OwnerId: ownerId,
        OwnerEmail: ownerEmail,
        OwnerName: ownerName,
      }).unwrap();

      const message = (response as any)?.message;
      const newHouse = (response as any)?.NewHouse;

      if (!newHouse) {
        if (message) setSubmitError(message);
        return;
      }

      setSubmitSuccess(true);

      // Reset form + previews
      setForm(emptyForm);
      setTouched({});
      setSelectedFile(null);
      setSelectedFileName('');
      setImagePreview(null);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      if (fileInputRef.current) fileInputRef.current.value = '';

      router.push('/owner/ownerdashboard');
    } catch (err: any) {
      setSubmitError(err?.data?.message ?? err?.error ?? 'Something went wrong');
    }
  };

  /* ---------- Render ---------- */
  return (
    <>
    <TopOwnerMenu/>
    <div className={styles.createHouseWrapper}>
      <main className={styles.dashboardCard}>
        {/* ============ FORM COLUMN ============ */}
        <section className={styles.formContainer}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ textAlign: 'center' }}>{MAIN_TITLE}</h2>
            <p className={styles.subtitle}>
              Enter the required technical specifications to index the
              <br /> property inside the MongoDB catalog.
            </p>
          </div>

          {submitSuccess && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              ✓ Data structure successfully prepared for the Multer multipart backend.
            </div>
          )}

          {submitError && (
            <div
              className={styles.alert}
              style={{
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.4)',
                color: '#fca5a5',
              }}
            >
              {submitError}
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className={styles.formGrid}>
              {/* House Code */}
              <div className={styles.formGroup}>
                <label htmlFor="houseCode">House Code / Identifier</label>
                <input
                  id="houseCode"
                  type="text"
                  value={form.houseCode}
                  onChange={onFieldChange('houseCode')}
                  onBlur={onBlur('houseCode')}
                  placeholder="e.g. LUX-CARACAS-01"
                  className={
                    touched.houseCode && isHouseCodeInvalid ? styles.invalid : ''
                  }
                />
                {touched.houseCode && isHouseCodeInvalid && (
                  <div className={styles.errorText}>
                    The identifier code is required (Minimum 3 characters).
                  </div>
                )}
              </div>

              {/* Rent Price */}
              <div className={styles.formGroup}>
                <label htmlFor="RentPrice">Rent Price (USD)</label>
                <input
                  id="RentPrice"
                  type="number"
                  value={form.RentPrice}
                  onChange={onFieldChange('RentPrice')}
                  onBlur={onBlur('RentPrice')}
                  className={
                    touched.RentPrice && isRentPriceInvalid ? styles.invalid : ''
                  }
                />
                {touched.RentPrice && isRentPriceInvalid && (
                  <div className={styles.errorText}>
                    You must specify a valid base rent amount.
                  </div>
                )}
              </div>

              {/* ===== IMAGE FILE + PREVIEW ===== */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="image">
                  Property Image File (Processed by Multer Backend)
                </label>

                <div
                  className={`${styles.fileUploadWrapper} ${
                    touched.image && isImageInvalid ? styles.invalid : ''
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={onFileSelect}
                    onBlur={onBlur('image')}
                  />
                  <span className={styles.filePlaceholder}>
                    {selectedFileName || 'Choose property image file...'}
                  </span>
                </div>

                {/* Preview card — only when a file was chosen */}
                {imagePreview && (
                  <div className={styles.imagePreviewWrapper}>
                    <img
                      src={imagePreview}
                      alt="Selected property preview"
                      className={styles.imagePreview}
                    />
                    <div className={styles.imagePreviewMeta}>
                      <span title={selectedFileName}>
                        {selectedFileName}
                      </span>
                      <button
                        type="button"
                        className={styles.btnClearImage}
                        onClick={onClearImage}
                        aria-label="Remove selected image"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                )}

                {touched.image && isImageInvalid && (
                  <div className={styles.errorText}>
                    The reference image file is strictly required for binary
                    multipart uploading.
                  </div>
                )}
              </div>

              {/* State */}
              <div className={styles.formGroup}>
                <label htmlFor="state">State / Region</label>
                <input
                  id="state"
                  type="text"
                  value={form.state}
                  onChange={onFieldChange('state')}
                  onBlur={onBlur('state')}
                  placeholder="e.g. Miranda"
                  className={
                    touched.state && !form.state.trim() ? styles.invalid : ''
                  }
                />
              </div>

              {/* City */}
              <div className={styles.formGroup}>
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  value={form.city}
                  onChange={onFieldChange('city')}
                  onBlur={onBlur('city')}
                  placeholder="e.g. Caracas"
                  className={
                    touched.city && !form.city.trim() ? styles.invalid : ''
                  }
                />
              </div>

              {/* Street */}
              <div className={styles.formGroup}>
                <label htmlFor="street">Street / Avenue</label>
                <input
                  id="street"
                  type="text"
                  value={form.street}
                  onChange={onFieldChange('street')}
                  onBlur={onBlur('street')}
                  placeholder="e.g. Francisco de Miranda Ave."
                  className={
                    touched.street && !form.street.trim() ? styles.invalid : ''
                  }
                />
              </div>

              {/* Pincode */}
              <div className={styles.formGroup}>
                <label htmlFor="pincode">Zip Code / Pincode</label>
                <input
                  id="pincode"
                  type="text"
                  value={form.pincode}
                  onChange={onFieldChange('pincode')}
                  onBlur={onBlur('pincode')}
                  placeholder="e.g. 1060"
                  className={
                    touched.pincode && isPincodeInvalid ? styles.invalid : ''
                  }
                />
                {touched.pincode && isPincodeInvalid && (
                  <div className={styles.errorText}>
                    Please enter a valid numerical format.
                  </div>
                )}
              </div>

              {/* Landmark */}
              <div className={styles.formGroup}>
                <label htmlFor="landmark">Landmark</label>
                <input
                  id="landmark"
                  type="text"
                  value={form.landmark}
                  onChange={onFieldChange('landmark')}
                  placeholder="e.g. In front of East Park"
                />
              </div>

              {/* Total Rooms */}
              <div className={styles.formGroup}>
                <label htmlFor="totalRooms">Total Rooms</label>
                <input
                  id="totalRooms"
                  type="number"
                  value={form.totalRooms}
                  onChange={onFieldChange('totalRooms')}
                  onBlur={onBlur('totalRooms')}
                  className={
                    touched.totalRooms && isTotalRoomsInvalid ? styles.invalid : ''
                  }
                />
              </div>

              {/* Legal Documents */}
              <div className={styles.formGroup}>
                <label htmlFor="legalDocuments">
                  Legal Documents (Comma-separated)
                </label>
                <input
                  id="legalDocuments"
                  type="text"
                  value={form.legalDocuments}
                  onChange={onFieldChange('legalDocuments')}
                  placeholder="property_deed.pdf, tax_registration.pdf"
                />
              </div>

              {/* Description */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="description">Detailed Property Description</label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={onFieldChange('description')}
                  onBlur={onBlur('description')}
                  placeholder="Describe the luxury finishes, included services, and special features of the surroundings..."
                  className={
                    touched.description && isDescriptionInvalid
                      ? styles.invalid
                      : ''
                  }
                />
                {touched.description && isDescriptionInvalid && (
                  <div className={styles.errorText}>
                    The description is required for public catalog listing
                    purposes.
                  </div>
                )}
              </div>
            </div>

            <div className={styles.actionsPanel}>
              {/* Back button — same shape as submit */}
              <button
                type="button"
                className={`${styles.btnSubmit} ${styles.btnBack}`}
                onClick={goBackToOwnerDashboard}
              >
                ← Back to Owner Dashboard
              </button>
              <div style={{ height:'1em'}}>

              </div>

              {/* Submit */}
              <button
                type="submit"
                className={styles.btnSubmit}
                disabled={isFormInvalid || isSubmitting}
              >
                {isSubmitting
                  ? 'Uploading Data & File...'
                  : 'Create House Element'}
              </button>
            </div>
          </form>
        </section>

        {/* ============ VISUAL COLUMN ============ */}
        <section className={styles.visualContainer}>
          <img
            src={visualImage}
            alt="Modern Premium Architectural House Render"
            className={styles.houseImage}
            onError={() => setVisualImage(DEFAULT_VISUAL)}
          />
          <div className={styles.imageOverlayText}>
            <h3>RentControl Enterprise</h3>
            <p>
              Ensuring relational data and multipart document consistency
              between your Angular SPA components and the transactional
              MongoDB cluster via Multer.
            </p>
          </div>
        </section>
      </main>
    </div>
    <Footer/>
  </>  
  );
}