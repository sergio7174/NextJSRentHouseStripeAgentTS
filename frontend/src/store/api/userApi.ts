// nexthouserentingDeepAgentsTSBETS\frontend\src\store\api\userApi.ts
import { baseApi } from "./baseApi";
import { environment } from "@/environments/environments";

// ==========================================
// TYPES / DTOs
// ==========================================

export interface User {
  _id: string;
  fullName?: string;
  email?: string;
  ide?: string;
  role?: string;
  phoneNumber?: string;
  image?: string | null;
  [key: string]: unknown;
}

export interface UserProfilePayload {
  fullName: string;
  email: string;
  password: string;
  ide: string;
  phoneNumber: string;
}

export interface UpdateUserNewImageArgs {
  userId: string;
  postData: UserProfilePayload;
  selectedFile: File;
  UserRole: string;
}

export interface UpdateUserOldImageArgs {
  userId: string;
  postData: UserProfilePayload;
  Oldimage: string;
  UserRole: string;
}

export interface DeleteUserImageArgs {
  image: string;
}

export interface UpdatePasswordArgs {
  id: string;
  password: string;
}

interface UserListResponse {
  success?: boolean;
  data?: User[];
}

interface ApiMessageResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

const myAppUrl = environment.endpoint;
const myApiUrl = '/api/user';
const userUrl = `${myAppUrl+myApiUrl}`

// ==========================================
// USER API
// ==========================================

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // 1. UPDATE USER PROFILE WITH NEW IMAGE
    updateUserNewImage: builder.mutation<
      ApiMessageResponse,
      UpdateUserNewImageArgs
    >({
      query: ({
        userId,
        postData,
        selectedFile,
        UserRole,
      }) => {
        const uploadData = new FormData();

        uploadData.append(
          "fullName",
          postData.fullName
        );

        uploadData.append(
          "email",
          postData.email
        );

        uploadData.append(
          "password",
          postData.password
        );

        uploadData.append(
          "ide",
          postData.ide
        );

        uploadData.append(
          "role",
          UserRole
        );

        uploadData.append(
          "phoneNumber",
          postData.phoneNumber
        );

        uploadData.append(
          "image",
          selectedFile
        );

        return {
          url: `${userUrl}/updateuserNewImage/${encodeURIComponent(userId)}`,
          method: "PUT",
          body: uploadData,
        };
      },

      invalidatesTags: (result, error, args) => [
        { type: "User", id: args.userId },
        { type: "User", id: "LIST" },
      ],
    }),

    // 2. UPDATE USER PROFILE KEEPING OLD IMAGE
    updateUserOldImage: builder.mutation<
      ApiMessageResponse,
      UpdateUserOldImageArgs
    >({
      query: ({
        userId,
        postData,
        Oldimage,
        UserRole,
      }) => ({
        url: `${userUrl}/updateuser/${encodeURIComponent(userId)}`,
        method: "PUT",

        body: {
          fullName: postData.fullName,
          email: postData.email,
          password: postData.password,
          ide: postData.ide,
          role: UserRole,
          phoneNumber: postData.phoneNumber,
          image: Oldimage,
        },
      }),

      invalidatesTags: (result, error, args) => [
        { type: "User", id: args.userId },
        { type: "User", id: "LIST" },
      ],
    }),

    // 3. GET USER BY ID
    getUserById: builder.query<
      User,
      string
    >({
      query: (id) =>
        `${userUrl}/getuserbyid/${encodeURIComponent(id)}`,

      providesTags: (result, error, id) => [
        { type: "User", id },
      ],
    }),

    // 4. DELETE USER IMAGE
    deleteUserImage: builder.mutation<
      ApiMessageResponse,
      DeleteUserImageArgs
    >({
      query: ({ image }) => ({
        url: "${userUrl}/delete-image",
        method: "POST",
        body: { image },
      }),

      invalidatesTags: [
        { type: "User", id: "LIST" },
      ],
    }),

    // 5. UPDATE USER PASSWORD
    putUpdatePassword: builder.mutation<
      ApiMessageResponse,
      UpdatePasswordArgs
    >({
      query: ({ password, id }) => ({
        url: `${userUrl}/updatepassword/${encodeURIComponent(id)}`,
        method: "PUT",

        body: {
          password,
        },
      }),

      invalidatesTags: (result, error, args) => [
        { type: "User", id: args.id },
      ],
    }),

    // 6. DELETE USER
    deleteUser: builder.mutation<
      ApiMessageResponse,
      string
    >({
      query: (id) => ({
        url: `${userUrl}/delete-user/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    // 7. GET ALL USERS
    getallusers: builder.query<
      User[],
      void
    >({
      query: () => "${userUrl}/getallusers",

      transformResponse: (
        response: UserListResponse
      ) => response.data ?? [],

      providesTags: (result) => [
        { type: "User", id: "LIST" },
        ...(result ?? []).map((user) => ({
          type: "User" as const,
          id: user._id,
        })),
      ],
    }),

  }),

  overrideExisting: false,
});

// ==========================================
// GENERATED HOOKS
// ==========================================

export const {
  useUpdateUserNewImageMutation,
  useUpdateUserOldImageMutation,
  useGetUserByIdQuery,
  useDeleteUserImageMutation,
  usePutUpdatePasswordMutation,
  useDeleteUserMutation,
  useGetallusersQuery,
} = userApi;
