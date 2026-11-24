// nexthouserentingDeepAgentsTSBETS\frontend\src\store\api\ashboardApi.ts
import { baseApi } from "./baseApi";
import { environment } from "@/environments/environments";

// ==========================================
// TYPES
// ==========================================

export interface DashboardStats {
  [key: string]: unknown;
}

export interface DashboardHouse {
  _id: string;
  houseCode?: string;
  city?: string;
  state?: string;
  [key: string]: unknown;
}

export interface DashboardBooking {
  _id: string;
  houseId?: string;
  tenantId?: string;
  ownerId?: string;
  [key: string]: unknown;
}

export interface DashboardMaintenanceRequest {
  _id: string;
  houseId?: string;
  approvalStatus?: string;
  [key: string]: unknown;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const myAppUrl = environment.endpoint;
const myApiUrl = '/api/metrics';
const metricsUrl = `${myAppUrl+myApiUrl}`

// ==========================================
// DASHBOARD API
// ==========================================

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // 1. GET DASHBOARD METRICS
    getMetrics: builder.query<
      DashboardStats,
      void
    >({
      query: () => `${metricsUrl}/`,

      transformResponse: (
        response: ApiResponse<DashboardStats>
      ) => response.data,

      providesTags: [
        { type: "Dashboard", id: "STATS" },
      ],
    }),

    // 2. GET LATEST CREATED HOUSES
    getLatestCreated: builder.query<
      DashboardHouse[],
      void
    >({
      query: () => `${metricsUrl}/latest-created`,

      transformResponse: (
        response: ApiResponse<DashboardHouse[]>
      ) => response.data,

      providesTags: [
        { type: "Dashboard", id: "LATEST_CREATED" },
        { type: "House", id: "LIST" },
      ],
    }),

    // 3. GET LATEST BOOKED HOUSES
    getLatestBooked: builder.query<
      DashboardBooking[],
      void
    >({
      query: () => `${metricsUrl}/latest-booked`,

      transformResponse: (
        response: ApiResponse<DashboardBooking[]>
      ) => response.data,

      providesTags: [
        { type: "Dashboard", id: "LATEST_BOOKED" },
        { type: "Booking", id: "LIST" },
      ],
    }),

    // 4. GET LATEST MAINTENANCE REQUESTS
    getLatestRequests: builder.query<
      DashboardMaintenanceRequest[],
      void
    >({
      query: () => `${metricsUrl}/latest-maintenance`,

      transformResponse: (
        response: ApiResponse<
          DashboardMaintenanceRequest[]
        >
      ) => response.data,

      providesTags: [
        { type: "Maintenance", id: "LATEST" },
        { type: "Maintenance", id: "LIST" },
      ],
    }),

    // 5. GET ALL MAINTENANCE REQUESTS
    getallMaintenanceRequests: builder.query<
      DashboardMaintenanceRequest[],
      void
    >({
      query: () => `${metricsUrl}/all-maintenance-request`,

      transformResponse: (
        response: ApiResponse<
          DashboardMaintenanceRequest[]
        >
      ) => response.data,

      providesTags: [
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
  useGetMetricsQuery,
  useGetLatestCreatedQuery,
  useGetLatestBookedQuery,
  useGetLatestRequestsQuery,
  useGetallMaintenanceRequestsQuery,
} = dashboardApi;
