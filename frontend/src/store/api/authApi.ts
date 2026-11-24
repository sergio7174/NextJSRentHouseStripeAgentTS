// nexthouserentingDeepAgentsTSBETS\frontend\src\store\api\authApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  baseApi,
  baseQueryWithAuth,
  resetAuthRedirectFlag,
} from "./baseApi";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    // Equivalent to login(credentials)
    login: builder.mutation({
      query: (credentials) => ({
        url: "/api/auth/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          resetAuthRedirectFlag();
        } catch {
          // Handled by caller or error state
        }
      },
    }),

    // Clear session cookie on server and reset RTK Query caches on client
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/api/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
          }
          dispatch(authApi.util.resetApiState());
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),

    // Equivalent to registerUser(postData, selectedFile) using FormData
    registerUser: builder.mutation({
      query: ({ postData, selectedFile, userChoice }) => {
        const uploadData = new FormData();
        uploadData.append("fullName", postData.fullName);
        uploadData.append("email", postData.email);
        uploadData.append("password", postData.password);
        uploadData.append("ide", postData.ide);
        uploadData.append("phoneNumber", postData.phoneNumber);
        uploadData.append("role", userChoice);
        if (selectedFile) {
          uploadData.append("image", selectedFile);
        }
        alert(`Im in authApi.ts - line 40 - User Choice: ${userChoice}`); // Debugging alert
        alert(`Im in authApi.ts - line 41 - user role: ${postData.role}`); // Debugging alert
        return {
          url: "/api/auth/signUp",
          method: "POST",
          body: uploadData,
          // Note: When sending FormData, fetch automatically sets the correct multipart headers
        };
      },
    }),

    // Equivalent to registerUser(postData, selectedFile) using FormData
    registerUserByAdmin: builder.mutation({
      query: ({ postData, selectedFile, userChoice }) => {
        const uploadData = new FormData();
        uploadData.append("fullName", postData.fullName);
        uploadData.append("email", postData.email);
        uploadData.append("password", postData.password);
        uploadData.append("ide", postData.ide);
        uploadData.append("phoneNumber", postData.phoneNumber);
        uploadData.append("role", postData.role);
        if (selectedFile) {
          uploadData.append("image", selectedFile);
        }
        alert(`Im in authApi.ts - line 40 - User Choice: ${userChoice}`); // Debugging alert
        alert(`Im in authApi.ts - line 41 - user role: ${postData.role}`); // Debugging alert
        return {
          url: "/api/auth/signUp",
          method: "POST",
          body: uploadData,
          // Note: When sending FormData, fetch automatically sets the correct multipart headers
        };
      },
    }),

    // Equivalent to getOneAdmin()
    getOneAdmin: builder.query({
      query: () => "/api/auth/getoneadmin",
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useLoginMutation,
  useLogoutMutation,
  useRegisterUserMutation,
  useRegisterUserByAdminMutation,
  useGetOneAdminQuery,
} = authApi;