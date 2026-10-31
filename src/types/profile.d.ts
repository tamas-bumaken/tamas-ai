import {
  BusinessType,
  Regency,
  TouristDependence,
} from "@/constans/business-profile";

export type Profile = {
  id: string;
  username: string;
  business_name: string | null;
  business_type: BusinessType | null;
  regency: Regency | null;
  tourist_dependence: TouristDependence | null;
};
