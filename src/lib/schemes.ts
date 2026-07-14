import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Scheme = Tables<"schemes">;

export type UserProfile = {
  age: number;
  gender: "male" | "female" | "other";
  state: string;
  areaType: "urban" | "rural";
  annualIncome: number;
  occupation: string;
  parentOccupation?: "govt" | "pvt" | "self-employed" | "farmer" | "labour" | "unemployed" | "na";
  hasDisability: boolean;
};

export const schemesQueryOptions = queryOptions({
  queryKey: ["schemes"],
  queryFn: async (): Promise<Scheme[]> => {
    const { data, error } = await supabase
      .from("schemes")
      .select("*")
      .order("is_popular", { ascending: false })
      .order("name");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 5 * 60_000,
});

export function matchesProfile(scheme: Scheme, p: UserProfile): boolean {
  if (scheme.min_age != null && p.age < scheme.min_age) return false;
  if (scheme.max_age != null && p.age > scheme.max_age) return false;
  if (scheme.gender !== "any" && scheme.gender !== p.gender) return false;
  if (scheme.max_annual_income != null && p.annualIncome > scheme.max_annual_income) return false;
  if (scheme.disability_required && !p.hasDisability) return false;
  if (scheme.state && scheme.state !== p.state) return false;
  if (scheme.occupations.length > 0) {
    const allowed = scheme.occupations;
    if (!allowed.includes("any") && !allowed.includes(p.occupation)) return false;
  }
  return true;
}

export function scoreScheme(scheme: Scheme, p: UserProfile): number {
  let score = 0;
  if (scheme.occupations.includes(p.occupation)) score += 3;
  if (scheme.gender === p.gender) score += 1;
  if (scheme.is_popular) score += 1;
  if (scheme.disability_required && p.hasDisability) score += 2;
  if (scheme.state && scheme.state === p.state) score += 2;
  return score;
}

export const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh","Puducherry",
  "Chandigarh","Andaman and Nicobar Islands","Dadra and Nagar Haveli and Daman and Diu","Lakshadweep",
];

export const OCCUPATIONS = [
  { value: "farmer", label: "Farmer" },
  { value: "labour", label: "Labourer / Daily Wage" },
  { value: "unorganised-worker", label: "Unorganised Sector Worker" },
  { value: "self-employed", label: "Self-employed" },
  { value: "entrepreneur", label: "Entrepreneur / Business Owner" },
  { value: "business", label: "Small Business" },
  { value: "street-vendor", label: "Street Vendor" },
  { value: "student", label: "Student" },
  { value: "unemployed", label: "Unemployed" },
  { value: "salaried", label: "Salaried Employee" },
  { value: "any", label: "Other / Not Listed" },
];
