export interface Property {
  id: number;
  agent_id: number;
  title: string;
  description: string;
  price: number | string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number | string;
  bathrooms: number | string;
  sqft: number | string;
  type: string;
  status: string;
  images: string[] | string | null;
  features: string[] | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  agents?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    company: string;
    license: string;
    rating: number | string;
    reviews_count: number;
  };
}

export interface Agent {
  id: number;
  name: string;
  email: string;
  phone: string;
  bio: string;
  company: string;
  license: string;
  rating: number | string;
  reviews_count: number;
  properties?: Property[];
}
