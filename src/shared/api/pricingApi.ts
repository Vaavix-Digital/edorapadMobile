import { api } from './client';
import { API_ENDPOINTS } from '../constants/endpoints';

// ─── Institute Pricing Types ───────────────────────────────────────────────────

export interface InstitutePackage {
  id: string;
  name: string;
  studentCap: number | null;
  sizeLabel: string;
  isCustomQuote: boolean;
  isPurchasable: boolean;
  description: string | null;
  /** Feature key strings e.g. "ATTENDANCE", "BASIC_LMS" */
  features: string[];
  currency: string;
  monthlyPrice: number | null;
  priceLabel: string;
  annualPrice: number | null;
  annualPriceLabel: string | null;
  /** Human-readable feature bullets */
  includes: string[];
}

export interface InstituteAddOn {
  id: string;
  name: string;
  unit: string;
  currency: string;
  price: number;
  priceLabel: string;
}

export interface InstituteTerms {
  overageRule: string;
  annualPlan: {
    description: string;
    billedMonths: number;
    freeMonths: number;
  };
  foundingCustomerOffer?: {
    description: string;
    packageId: string;
    seats: number;
    lockInMonths: number;
    currency: string;
    monthlyPrice: number;
    priceLabel: string;
  };
}

export interface InstitutePricingData {
  country: { code: string; name: string };
  currency: string;
  headline: string;
  packages: InstitutePackage[];
  addOns: InstituteAddOn[];
  terms: InstituteTerms;
  countrySource: string;
}

export interface InstitutePricingResponse {
  success: boolean;
  data: InstitutePricingData;
}

// ─── Course Creator Pricing Types ─────────────────────────────────────────────

export interface CreatorPlan {
  id: string;
  name: string;
  currency: string;
  monthlyFee: number;
  feeLabel: string;
  commissionPercent: number;
  commissionRate: number;
  commissionLabel: string;
  includes: string[];
}

export interface CreatorAddOn {
  id: string;
  name: string;
  unit: string;
  currency: string;
  price: number;
  priceLabel: string;
}

export interface CreatorTerms {
  payoutCycle: {
    description: string;
    days: number;
    method: string;
  };
  institutionalCreators: {
    description: string;
    qualifyingPackages: string[];
    effectiveCommissionPercent: number;
  };
}

export interface CreatorPricingData {
  country: { code: string; name: string };
  currency: string;
  headline: string;
  plans: CreatorPlan[];
  addOns: CreatorAddOn[];
  terms: CreatorTerms;
  countrySource: string;
}

export interface CreatorPricingResponse {
  success: boolean;
  data: CreatorPricingData;
}

// ─── API Methods ───────────────────────────────────────────────────────────────

export const pricingApi = {
  /**
   * Fetch dynamic pricing for Educational Institutions
   * GET /api/pricing/institute
   */
  getInstitutePricing: async (): Promise<InstitutePricingResponse> => {
    const response = await api.get(API_ENDPOINTS.PRICING.INSTITUTE);
    return response.data;
  },

  /**
   * Fetch dynamic pricing for Independent Course Creators
   * GET /api/pricing/course-creator
   */
  getCourseCreatorPricing: async (): Promise<CreatorPricingResponse> => {
    const response = await api.get(API_ENDPOINTS.PRICING.COURSE_CREATOR);
    return response.data;
  },
};
