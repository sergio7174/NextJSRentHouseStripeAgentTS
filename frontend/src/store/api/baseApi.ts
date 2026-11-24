// nexthouserentingDeepAgentsTSBETS\frontend\src\store\api\baseApi.ts
// nexthouserentingDeepAgentsTSBETS\frontend\src\store\api\baseApi.ts
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

// Backend root URL, without the /api suffix.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:3001";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",

  prepareHeaders: (headers, { getState }) => {
    const state = getState() as {
      auth?: { token?: string | null };
      user?: { token?: string | null };
    };

    const token =
      state.auth?.token ??
      state.user?.token ??
      (typeof window !== "undefined" ? localStorage.getItem("token") : null);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    // Do not manually set Content-Type here.
    // fetchBaseQuery sets application/json for plain objects and
    // generates the multipart boundary automatically for FormData.

    return headers;
  },
});

let isRedirectingToLogin = false;

export const resetAuthRedirectFlag = () => {
  isRedirectingToLogin = false;
};

export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }

    // Reset all cached RTK Query state on baseApi (including injected endpoints like bookingApi)
    api.dispatch(baseApi.util.resetApiState());

    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && !isRedirectingToLogin) {
        isRedirectingToLogin = true;
        window.location.assign(`/login?next=${encodeURIComponent(currentPath)}`);
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,

  tagTypes: [
    "Auth",
    "Booking",
    "House",
    "Dashboard",
    "Maintenance",
    "User",
  ],

  endpoints: () => ({}),
});