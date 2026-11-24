// nexthouserentingDeepAgentsTSBETS\frontend\src\store\api\houseApi.ts
import { baseApi } from "./baseApi";
import { environment } from "@/environments/environments";

// ==========================================
// TYPES / DTOs
// ==========================================

export interface RentHousePayload {
  houseId: string;
  ownerId: string;
  houseCode: string;
  state: string;
  city: string;
  street: string;
  image: string | null;
  RentPrice: number;
  ownerfullname: string;
  owneremail: string;
}


export interface House {
  _id: string;
  houseCode: string;
  ownerId: string;
  ownerfullname?: string;
  owneremail?: string;
  description?: string;
  booked?: boolean;
  pincode?: string;
  state?: string;
  city?: string;
  street?: string;
  landmark?: string;
  totalRooms?: number;
  RentPrice?: number;
  legalDocuments?: string;
  image?: string | null;
  [key: string]: unknown;
}

export interface CreateHousePayload {
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

export interface CreateHouseArgs {
  payload: CreateHousePayload;
  selectedFile: File;
  OwnerId: string;
  OwnerEmail: string;
  OwnerName: string;
}

export interface EditHouseArgs {
  payload: CreateHousePayload;
  selectedFile: File;
  id: string;
  OwnerId: string;
}

export interface EditHouseOldImageArgs {
  payload: CreateHousePayload & {
    booked?: boolean;
  };
  id: string;
  OwnerId: string;
  Oldimage: string;
}

export interface DeleteHouseImageArgs {
  image: string;
}

export interface UpdateHouseBookedArgs {
  _id: string | any;
  payload: {
    booked: boolean;
  };
}

interface HouseListResponse {
  success?: boolean;
  data?: House[];
  houses?: House[];
  results?: House[];
  availableHousesRaw?: House[];
}

interface ApiMessageResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

function normalizeHouseList(
  response: HouseListResponse | House[]
): House[] {
  if (Array.isArray(response)) return response;

  const payload =
    response?.data ??
    response?.houses ??
    response?.results ??
    response?.availableHousesRaw ??
    [];

  return Array.isArray(payload) ? payload : [];
}

const myAppUrl = environment.endpoint;
const myApiUrl = '/api/house';
const houseUrl = `${myAppUrl+myApiUrl}`

// ==========================================
// FORM DATA HELPERS
// ==========================================

function appendHouseFields(
  formData: FormData,
  payload: CreateHousePayload
) {
  formData.append("houseCode", payload.houseCode);
  formData.append("description", payload.description);
  formData.append("pincode", payload.pincode);
  formData.append("state", payload.state);
  formData.append("city", payload.city);
  formData.append("street", payload.street);
  formData.append("landmark", payload.landmark);

  formData.append(
    "totalRooms",
    String(payload.totalRooms)
  );

  formData.append(
    "RentPrice",
    String(payload.RentPrice)
  );

  formData.append(
    "legalDocuments",
    payload.legalDocuments
  );
}

// ==========================================
// HOUSE API
// ==========================================

export const houseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // 1. CREATE HOUSE WITH IMAGE
    createHouse: builder.mutation<
      ApiMessageResponse,
      CreateHouseArgs
    >({
      query: ({
        payload,
        selectedFile,
        OwnerId,
        OwnerEmail,
        OwnerName,
      }) => {
        const formData = new FormData();

        appendHouseFields(formData, payload);

        formData.append("ownerfullname", OwnerName);
        formData.append("owneremail", OwnerEmail);
        formData.append("ownerId", OwnerId);
        formData.append("booked", "false");
        formData.append("image", selectedFile);

        return {
          url: `${houseUrl}/createhouse`,
          method: "POST",
          body: formData,
        };
      },

      invalidatesTags: [
        { type: "House", id: "LIST" },
        { type: "Dashboard", id: "LATEST_CREATED" },
        { type: "Dashboard", id: "STATS" },
      ],
    }),

    // 2. EDIT HOUSE WITH NEW IMAGE
    edithouse: builder.mutation<
      ApiMessageResponse,
      EditHouseArgs
    >({
      query: ({
        payload,
        selectedFile,
        id,
        OwnerId,
      }) => {
        const formData = new FormData();

        appendHouseFields(formData, payload);

        formData.append("ownerId", OwnerId);
        formData.append("image", selectedFile);

        return {
          url: `${houseUrl}/update-house/${encodeURIComponent(id)}`,
          method: "PUT",
          body: formData,
        };
      },

      invalidatesTags: (result, error, args) => [
        { type: "House", id: args.id },
        { type: "House", id: "LIST" },
        { type: "Dashboard", id: "LATEST_CREATED" },
      ],
    }),

    // 3. EDIT HOUSE KEEPING OLD IMAGE
    edithouseOldImage: builder.mutation<
      ApiMessageResponse,
      EditHouseOldImageArgs
    >({
      query: ({
        payload,
        id,
        OwnerId,
        Oldimage,
      }) => ({
        url: `${houseUrl}/update-houseOLdImage/${encodeURIComponent(id)}`,
        method: "PUT",
        body: {
          houseCode: payload.houseCode,
          ownerId: OwnerId,
          description: payload.description,
          booked: payload.booked,
          pincode: payload.pincode,
          state: payload.state,
          city: payload.city,
          street: payload.street,
          landmark: payload.landmark,
          totalRooms: payload.totalRooms,
          RentPrice: payload.RentPrice,
          legalDocuments: payload.legalDocuments,
          image: Oldimage,
        },
      }),

      invalidatesTags: (result, error, args) => [
        { type: "House", id: args.id },
        { type: "House", id: "LIST" },
        { type: "Dashboard", id: "LATEST_CREATED" },
      ],
    }),

    // 4. GET ALL HOUSES
    getAllHouses: builder.query<House[], void>({
      query: () => `${houseUrl}/listAllHouses`,

      transformResponse: (
        response: HouseListResponse | House[]
      ) => normalizeHouseList(response),

      providesTags: (result) => [
        { type: "House", id: "LIST" },
        ...(result ?? []).map((house) => ({
          type: "House" as const,
          id: house._id,
        })),
      ],
    }),

    // 5. GET AVAILABLE HOUSES (BOOKED FALSE)
    getAvailableHousesBookedFalse: builder.query<
      any[],
      void
    >({
      
      query: () =>
        `${houseUrl}/listAllHousesBookedFalse`,

      transformResponse: (
        response: HouseListResponse | House[]
      ) => normalizeHouseList(response),

      providesTags: [
        { type: "House", id: "LIST" },
      ],
    }),

    // 6. GET AVAILABLE HOUSES
    // Angular uses the same listAllHouses endpoint.
    getAvailableHouses: builder.query<any[], void>({
      query: () => `${houseUrl}/listAllHouses`,

      transformResponse: (
        response: HouseListResponse | House[]
      ) => normalizeHouseList(response),

      providesTags: [
        { type: "House", id: "LIST" },
      ],
    }),

    // 7. GET OWNER HOUSES BOOKED FALSE
    getHousesByOwnerBfalse: builder.query<
      House[],
      string
    >({
      query: (ownerId) =>
        `${houseUrl}/listAllbyOwnerBfalse/${encodeURIComponent(ownerId)}`,

      transformResponse: (response: HouseListResponse | House[]) =>
        normalizeHouseList(response),

      providesTags: (result) => [
        { type: "House", id: "LIST" },
        ...(result ?? []).map((house) => ({
          type: "House" as const,
          id: house._id,
        })),
      ],
    }),

    // 8. GET OWNER HOUSES BOOKED TRUE
    getHousesByOwnerBtrue: builder.query<
      House[],
      string
    >({
      query: (ownerId) =>
        
        `${houseUrl}/listAllbyOwnerBtrue/${encodeURIComponent(ownerId)}`,

      transformResponse: (response: HouseListResponse | House[]) =>
        normalizeHouseList(response),

      providesTags: (result) => [
        { type: "House", id: "LIST" },
        ...(result ?? []).map((house) => ({
          type: "House" as const,
          id: house._id,
        })),
      ],
    }),

    // 9. GET HOUSES BY OWNER ID
    getHousesByOwnerId: builder.query<
      House[],
      string
    >({
      query: (ownerId) =>
        `${houseUrl}/GetListAllHousesByOwnerId/${encodeURIComponent(ownerId)}`,

      transformResponse: (response: HouseListResponse | House[]) =>
        normalizeHouseList(response),

      providesTags: (result) => [
        { type: "House", id: "LIST" },
        ...(result ?? []).map((house) => ({
          type: "House" as const,
          id: house._id,
        })),
      ],
    }),

    // 10. GET HOUSES BY OWNER
    getHousesByOwner: builder.query<
      House[],
      string
    >({
      query: (ownerId) =>
        `${houseUrl}/GetListAllHousesByOwner/${encodeURIComponent(ownerId)}`,

      providesTags: (result) => [
        { type: "House", id: "LIST" },
        ...(result ?? []).map((house) => ({
          type: "House" as const,
          id: house._id,
        })),
      ],
    }),

    // 11. GET HOUSE BY ID
    getHouseById: builder.query<
      House,
      string
    >({
      query: (id) =>
        `${houseUrl}/get-single-House/${encodeURIComponent(id)}`,

      providesTags: (result, error, id) => [
        { type: "House", id },
      ],
    }),

    // 12. DELETE HOUSE IMAGE
    deleteImage: builder.mutation<
      ApiMessageResponse,
      DeleteHouseImageArgs
    >({
      query: ({ image }) => ({
        url: "${houseUrl}/delete-image",
        method: "POST",
        body: { image },
      }),

      invalidatesTags: [
        { type: "House", id: "LIST" },
      ],
    }),

    // 13. DELETE HOUSE
    deleteHouse: builder.mutation<
      ApiMessageResponse,
      string
    >({
      query: (id) => ({
        url: `${houseUrl}/delete-house/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, id) => [
        { type: "House", id },
        { type: "House", id: "LIST" },
        { type: "Dashboard", id: "LATEST_CREATED" },
        { type: "Dashboard", id: "STATS" },
      ],
    }),
    // 14. UPDATE HOUSE BOOKED STATUS
    edithouseupdatebooked: builder.mutation({
      query: ({ house, data }) => {
        //const formData = new FormData();
        alert("Im at houseApi - line 435 - id: "+ house._id)
        //alert("Im at houseApi - line 436 - `${houseUrl}`+'/update-housebooked/'+`${house._id}`: "+ `${houseUrl}`+'/update-housebooked/'+`${house._id}`)

        /*formData.append(
          "booked",
          String(payload.booked)
        );*/
       
        return {
          url: `${houseUrl}`+'/update-housebooked/'+`${house._id}`,
          method: "PUT",
          body: data,
        };
      },

      invalidatesTags: (result, error, args) => [
        { type: "House", _id: args._id },
        { type: "House", _id: "LIST" },
        { type: "Dashboard", _id: "STATS" },
      ],
    }),

  }),

  overrideExisting: false,
});

// ==========================================
// GENERATED HOOKS
// ==========================================

export const {
  useCreateHouseMutation,
  useEdithouseMutation,
  useEdithouseOldImageMutation,
  useGetAllHousesQuery,
  useGetAvailableHousesBookedFalseQuery,
  useGetAvailableHousesQuery,
  useGetHousesByOwnerBfalseQuery,
  useGetHousesByOwnerBtrueQuery,
  useGetHousesByOwnerIdQuery,
  useGetHousesByOwnerQuery,
  useGetHouseByIdQuery,
  useDeleteImageMutation,
  useDeleteHouseMutation,
  useEdithouseupdatebookedMutation,
  
} = houseApi;
