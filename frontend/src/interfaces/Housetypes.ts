export interface House {
  _id: string;
  ownerId: string;
  houseCode: string;
  state: string;
  city: string;
  street: string;
  image: string | null;
  RentPrice: number;
  totalRooms: number;
  ownerfullname: string;
  owneremail: string;
}

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