// nexthouserentingDeepAgentsTSBETS\frontend\src\store\api\bookingApi.ts
import { baseApi } from "./baseApi";
import { environment } from "@/environments/environments";

// ==========================================
// TYPES / DTOs
// ==========================================

export interface CreateBookingPayload {
  houseId: string;
  tenantId: string;
  tenantfullname: string;
  tenantemail: string;
  ownerId: string;
  ownerfullname: string;
  owneremail: string;
  houseCode: string;
  state: string;
  city: string;
  street: string;
  image: string | null;
  RentPrice: number;
}

export interface ChangeHouseCheckedStatusPayload {
  houseId: string;
  OwnerChecked: boolean;
  approvalStatus: string;
  RentPrice: number;
}

export interface ChangeMaintenanceStatusPayload {
  houseId: string;
  approvalStatus: string;
}

export interface CreateMaintenanceRequestPayload {
  maintenaceRequest: string;
}

export interface BookingList {
  _id: string;
  houseId?: string;
  tenantId?: string;
  ownerId?: string;
  houseCode?: string;
  approvalStatus?: string;
  [key: string]: unknown;
}

export interface MaintenanceRequestItem {
  _id: string;
  houseId?: string;
  maintenaceRequest?: string;
  approvalStatus?: string;
  [key: string]: unknown;
}

interface BookingListResponse {
  success?: boolean;
  data?: BookingList[];
  Bookings?: BookingList[];
  bookings?: BookingList[];
  results?: BookingList[];
  ownerbooking?: BookingList[];
}

interface MaintenanceListResponse {
  success?: boolean;
  data?: MaintenanceRequestItem[];
  bookings?: MaintenanceRequestItem[];
  results?: MaintenanceRequestItem[];
}

type ApiMessageResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

const myAppUrl = environment.endpoint;
const myApiUrl = '/api/booking';
const bookingUrl = `${myAppUrl+myApiUrl}`


// ==========================================
// RESPONSE TRANSFORMATIONS
// ==========================================

function normalizeBookingList(
  response: BookingListResponse | BookingList[]
): BookingList[] {
  if (Array.isArray(response)) return response;

  const payload =
    response?.data ??
    response?.Bookings ??
    response?.bookings ??
    response?.results ??
    response?.ownerbooking ??
    [];

  return Array.isArray(payload) ? payload : [];
}

function normalizeMaintenanceList(
  response: MaintenanceListResponse | MaintenanceRequestItem[]
): MaintenanceRequestItem[] {
  if (Array.isArray(response)) return response;

  const payload =
    response?.data ??
    response?.bookings ??
    response?.results ??
    [];

  return Array.isArray(payload) ? payload : [];
}

// ==========================================
// BOOKING API
// ==========================================

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // 1. CREATE BOOKING
    createBooking: builder.mutation<
      ApiMessageResponse,
      CreateBookingPayload
    >({
      query: (payload) => ({
        url: `${bookingUrl}/createbooking`,
        method: "POST",
        body: payload,
      }),

      invalidatesTags: [
        { type: "Booking", id: "LIST" },
        { type: "House", id: "LIST" },
        { type: "Dashboard", id: "STATS" },
      ],
    }),

    // 2. GET RENTED HOUSES BY TENANT ID
    getRentedHousesByTenantId: builder.query<
      BookingList[],
      string
    >({
      query: (id) =>
        `${bookingUrl}/listAllBookingsByTenantId/${encodeURIComponent(id)}`,

      transformResponse: (
        response: BookingListResponse | BookingList[]
      ) => normalizeBookingList(response),

      providesTags: (result) => [
        { type: "Booking", id: "LIST" },
        ...(result ?? []).map((booking) => ({
          type: "Booking" as const,
          id: booking._id,
        })),
      ],
    }),

    // 3. GET RENTED HOUSES BY OWNER ID
    getRentedHousesByOwnerId: builder.query<
      BookingList[],
      string
    >({
      query: (id) =>
        `${bookingUrl}/listAllBookingsByOwnerId/${encodeURIComponent(id)}`,

      transformResponse: (
        response: BookingListResponse | BookingList[]
      ) => normalizeBookingList(response),

      providesTags: (result) => [
        { type: "Booking", id: "LIST" },
        ...(result ?? []).map((booking) => ({
          type: "Booking" as const,
          id: booking._id,
        })),
      ],
    }),

    // 4. CHANGE HOUSE CHECKED STATUS
    ChangeHouseCheckedStatus: builder.mutation<
      ApiMessageResponse,
      ChangeHouseCheckedStatusPayload
    >({
      query: (payload) => {
        const formData = new FormData();

        formData.append(
          "ownerChecked",
          String(payload.OwnerChecked)
        );

        formData.append(
          "approvalStatus",
          payload.approvalStatus
        );

        formData.append(
          "RentPrice",
          String(payload.RentPrice)
        );

        return {
          url: `${bookingUrl}/updateBookinghousechecked/${encodeURIComponent(payload.houseId)}`,
          method: "PUT",
          body: formData,
        };
      },

      invalidatesTags: [
        { type: "Booking", id: "LIST" },
        { type: "House", id: "LIST" },
        { type: "Dashboard", id: "STATS" },
      ],
    }),

    // 5. CHANGE MAINTENANCE REQUEST STATUS
    putchangeMaintReqStatus: builder.mutation<
      ApiMessageResponse,
      ChangeMaintenanceStatusPayload
    >({
      query: (payload) => {
        const formData = new FormData();

        formData.append(
          "approvalStatus",
          payload.approvalStatus
        );

        return {
          url: `${bookingUrl}/updateBookinghousechecked/${encodeURIComponent(payload.houseId)}`,
          method: "PUT",
          body: formData,
        };
      },

      invalidatesTags: [
        { type: "Booking", id: "LIST" },
        { type: "Maintenance", id: "LIST" },
      ],
    }),

    // 6. CREATE MAINTENANCE REQUEST ON BOOKING
    putMaintenanceReqCreate: builder.mutation<
      ApiMessageResponse,
      {
        id: string;
        payload: CreateMaintenanceRequestPayload;
      }
    >({
      query: ({ id, payload }) => {
        const formData = new FormData();

        // Preserve original backend field spelling.
        formData.append(
          "maintenaceRequest",
          payload.maintenaceRequest
        );

        return {
          url: `${bookingUrl}/bookinghousecreatemaintreq/${encodeURIComponent(id)}`,
          method: "PUT",
          body: formData,
        };
      },

      invalidatesTags: [
        { type: "Booking", id: "LIST" },
        { type: "Maintenance", id: "LIST" },
      ],
    }),

    // 7. GET ALL BOOKING DOCUMENTS
    getAllBookingsDocuments: builder.query<
      BookingList[],
      void
    >({
      query: () =>
        `${bookingUrl}/listAllBookingsDocuments`,

      transformResponse: (
        response: BookingListResponse | BookingList[]
      ) => normalizeBookingList(response),

      providesTags: (result) => [
        { type: "Booking", id: "LIST" },
        ...(result ?? []).map((booking) => ({
          type: "Booking" as const,
          id: booking._id,
        })),
      ],
    }),

    // 8. GET ALL BOOKING MAINTENANCE REQUESTS
    getAllBookingsMaintenanceRequest: builder.query<
      MaintenanceRequestItem[],
      void
    >({
      query: () =>
        `${bookingUrl}/listAllBookingsDocuments`,

      transformResponse: (
        response:
          | MaintenanceListResponse
          | MaintenanceRequestItem[]
      ) => normalizeMaintenanceList(response),

      providesTags: (result) => [
        { type: "Maintenance", id: "LIST" },
        ...(result ?? []).map((item) => ({
          type: "Maintenance" as const,
          id: item._id,
        })),
      ],
    }),

    // 9. DELETE MAINTENANCE REQUEST FROM BOOKING
    editbookingdeletemaintreq: builder.mutation<
      ApiMessageResponse,
      string
    >({
      query: (id) => {
        const formData = new FormData();

        formData.append("maintenaceRequest", "");
        formData.append("maintenaceRequestStatus", "None");

        return {
          url: `${bookingUrl}/bookingupdatemaintreq/${encodeURIComponent(id)}`,
          method: "PUT",
          body: formData,
        };
      },

      invalidatesTags: [
        { type: "Booking", id: "LIST" },
        { type: "Maintenance", id: "LIST" },
      ],
    }),

  }),

  overrideExisting: false,
});

// ==========================================
// GENERATED HOOKS
// ==========================================

export const {
  useCreateBookingMutation,
  useGetRentedHousesByTenantIdQuery,
  useGetRentedHousesByOwnerIdQuery,
  useChangeHouseCheckedStatusMutation,
  usePutchangeMaintReqStatusMutation,
  usePutMaintenanceReqCreateMutation,
  useGetAllBookingsDocumentsQuery,
  useGetAllBookingsMaintenanceRequestQuery,
  useEditbookingdeletemaintreqMutation,
} = bookingApi;
