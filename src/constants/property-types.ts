/**
 * Property types — mirrors `public.property_types` rows in the database.
 * Edit here AND in the DB seed to keep the two in sync.
 */
export const PROPERTY_TYPE_KEYS = [
  "apartment",
  "house",
  "shop",
  "building_land",
  "agricultural_land",
] as const;

export type PropertyTypeKey = (typeof PROPERTY_TYPE_KEYS)[number];

export interface PropertyTypeDef {
  key: PropertyTypeKey;
  labelAr: string;
  labelFr: string;
  labelEn: string;
  icon: string;
  sortOrder: number;
}

export const PROPERTY_TYPES: PropertyTypeDef[] = [
  { key: "apartment", labelAr: "شقة", labelFr: "Appartement", labelEn: "Apartment", icon: "Building2", sortOrder: 1 },
  { key: "house", labelAr: "منزل", labelFr: "Maison", labelEn: "House", icon: "Home", sortOrder: 2 },
  { key: "shop", labelAr: "محل تجاري", labelFr: "Local commercial", labelEn: "Shop", icon: "Store", sortOrder: 3 },
  { key: "building_land", labelAr: "أرض للبناء", labelFr: "Terrain à bâtir", labelEn: "Building land", icon: "LandPlot", sortOrder: 4 },
  { key: "agricultural_land", labelAr: "أرض فلاحية", labelFr: "Terrain agricole", labelEn: "Agricultural land", icon: "Sprout", sortOrder: 5 },
];

export const getPropertyType = (key: string) => PROPERTY_TYPES.find((p) => p.key === key);