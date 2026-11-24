'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';

// ---- API slice (houseApi.ts) ----
import {
  useGetHouseByIdQuery,
  useEdithouseMutation,
  useEdithouseOldImageMutation,
  useDeleteImageMutation,
} from '@/store/api/houseApi';

import { environment } from '@/environments/environments';
import styles from './owneredithouse.module.css';
import TopOwnerMenu from '@/components/layouts/topmenu/owner/TopOwnerMenu';
import Footer from "../../../components/layouts/footer/footer";

/* ============================================================
   Local config
   ============================================================ */
const BASE_URL = environment.endpointI;
const MAIN_TITLE = 'Edit House Form';
//const DEFAULT_VISUAL =
//  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
const DEFAULT_VISUAL ='/images/owneredithouse/owneredithouse.avif';
/* ============================================================
   Form shape (mirrors FormBuilder in Angular)
   ============================================================ */
interface HouseEditFormState {
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

const emptyForm: HouseEditFormState = {
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
   Owneredithouse
   ============================================================ */
export default function Owneredithouse() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const houseId: string = params?.id ?? '';

  /* ---------- Owner identity from the store ---------- */
  const owner = useAppSelector((state) => state.user);
  const ownerId: string = owner?.id ?? '';

  /* ---------- RTK Query: fetch house by id ---------- */
  const {
    data: houseData,
    isLoading: isLoadingHouse,
    isError: isHouseError,
  } = useGetHouseByIdQuery(houseId, { skip: !houseId });

  /* ---------- Mutations ---------- */
  const [editHouse, { isLoading: isSubmittingNewImage }] = useEdithouseMutation();
  const [editHouseOldImage, { isLoading: isSubmittingOldImage }] =
    useEdithouseOldImageMutation();
  const [deleteImage] = useDeleteImageMutation();

  const isSubmitting = isSubmittingNewImage || isSubmittingOldImage;

  /* ---------- Form state ---------- */
  const [form, setForm] = useState<HouseEditFormState>(emptyForm);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /* ---------- Image state ---------- */
  const [oldImagePreview, setOldImagePreview] = useState<string>(''); // imagePreviewUrlfb
  const [newImagePreview, setNewImagePreview] = useState<string>(''); // imagePreviewUrl
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------- UI feedback ---------- */
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* ---------- Visual fallback ---------- */
  const [visualImage, setVisualImage] = useState(
    'assets/images/modern-house-render.jpg'
  );

  /* ---------- Hydrate form when house data arrives ---------- */
  useEffect(() => {
    // The backend response in the Angular source is `{ house: {...} }`.
    // RTK Query + `getHouseById` may return the object directly or wrapped;
    // normalize defensively.
    const payload = (houseData as any)?.house ?? houseData;
    if (!payload) return;

    setForm({
      houseCode: payload.houseCode ?? '',
      description: payload.description ?? '',
      pincode: payload.pincode ?? '',
      state: payload.state ?? '',
      city: payload.city ?? '',
      street: payload.street ?? '',
      landmark: payload.landmark ?? '',
      totalRooms: payload.totalRooms ?? 0,
      RentPrice: payload.RentPrice ?? 0,
      legalDocuments: payload.legalDocuments ?? '',
    });
    setOldImagePreview(payload.image ?? '');
  }, [houseData]);

  /* ---------- Revoke object URL on unmount ---------- */
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  /* ---------- Validation ---------- */
  const isHouseCodeInvalid = form.houseCode.trim().length < 3;
  const isRentPriceInvalid = form.RentPrice < 0;
  const isPincodeInvalid = !/^[0-9]+$/.test(form.pincode.trim());
  const isDescriptionInvalid = form.description.trim().length === 0;
  const isTotalRoomsInvalid = form.totalRooms < 1;

  const isFormInvalid =
    isHouseCodeInvalid ||
    isRentPriceInvalid ||
    isPincodeInvalid ||
    isDescriptionInvalid ||
    isTotalRoomsInvalid ||
    !form.state.trim() ||
    !form.city.trim() ||
    !form.street.trim();

  /* ---------- Handlers ---------- */
  const onFieldChange =
    (field: keyof HouseEditFormState) =>
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

  const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setSelectedFileName(file?.name ?? '');

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setNewImagePreview(url);
    } else {
      setNewImagePreview('');
    }
  };

  const onClearNewImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setNewImagePreview('');
    setSelectedFile(null);
    setSelectedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ---------- Back to Owner Dashboard ---------- */
  const goBackToOwnerDashboard = () => {
    router.push('/owner/ownerdashboard');
  };

  /* ---------- Submit ---------- */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    // Mark all fields touched to surface validation messages
    setTouched({
      houseCode: true,
      description: true,
      pincode: true,
      state: true,
      city: true,
      street: true,
      totalRooms: true,
      RentPrice: true,
    });

    if (isFormInvalid) return;

    const payload = {
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
    };

    try {
      if (!selectedFile) {
        // ---- Path A: keep old image ----
        await editHouseOldImage({
          payload,
          id: houseId,
          OwnerId: ownerId,
          Oldimage: oldImagePreview,
        }).unwrap();
      } else {
        // ---- Path B: new image → delete old one, then upload new ----
        if (oldImagePreview) {
          try {
            await deleteImage({ image: oldImagePreview }).unwrap();
          } catch (imgErr) {
            // Non-fatal — proceed with document update anyway
            console.warn('Image delete failed:', imgErr);
          }
        }

        await editHouse({
          payload,
          selectedFile,
          id: houseId,
          OwnerId: ownerId,
        }).unwrap();
      }

      setSubmitSuccess(true);
      router.push('/owner/ownerdashboard');
    } catch (err: any) {
      setSubmitError(
        err?.data?.message ?? err?.error ?? 'Something went wrong'
      );
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
          {/* Back button */}
          <button
            type="button"
            className={styles.btnBack}
            onClick={goBackToOwnerDashboard}
            aria-label="Back to Owner Dashboard"
          >
            ← Back to Owner Dashboard
          </button>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ textAlign: 'center' }}>{MAIN_TITLE}</h2>
            <p className={styles.subtitle}>
              Enter the required technical specifications to update the
              <br /> property inside the MongoDB catalog.
            </p>
          </div>

          {/* Loading / error indicators */}
          {isLoadingHouse && (
            <div className={styles.alert} style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.4)', color: '#7dd3fc' }}>
              Loading house data…
            </div>
          )}
          {isHouseError && (
            <div className={styles.alert} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5' }}>
              Failed to load house data. Please try again.
            </div>
          )}

          {submitSuccess && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              ✓ House edited successfully. Redirecting…
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

              {/* Image file + previews (NEW + OLD side by side) */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="image">
                  Property Image File (Processed by Multer Backend)
                </label>

                <div className={styles.fileUploadWrapper}>
                  <input
                    ref={fileInputRef}
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={onFileSelect}
                  />
                  <span className={styles.filePlaceholder}>
                    {selectedFileName || 'Choose property image file...'}
                  </span>
                </div>

                {(newImagePreview || oldImagePreview) && (
                  <div className={styles.imagePreviewRow}>
                    {/* New image */}
                    {newImagePreview && (
                      <div className={styles.imagePreviewCard}>
                        <h6>New Image</h6>
                        <img
                          src={newImagePreview}
                          alt="New preview"
                          className={styles.imagePreview}
                        />
                        <button
                          type="button"
                          className={styles.btnClearImage}
                          onClick={onClearNewImage}
                          aria-label="Remove new image selection"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    )}

                    {/* Old image */}
                    {oldImagePreview && (
                      <div className={styles.imagePreviewCard}>
                        <h6>Old Image</h6>
                        <img
                          src={BASE_URL + oldImagePreview}
                          alt="Current preview"
                          className={`${styles.imagePreview} ${styles.imagePreviewOld}`}
                        />
                      </div>
                    )}
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
                {touched.totalRooms && isTotalRoomsInvalid && (
                  <div className={styles.errorText}>
                    Total rooms must be at least 1.
                  </div>
                )}
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
              <button
                type="submit"
                className={styles.btnSubmit}
                disabled={isSubmitting || isLoadingHouse}
              >
                {isSubmitting
                  ? 'Uploading Data & File...'
                  : 'Edit House Element'}
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