import supabase from './_supabase.js';

const listings = [
  {
    title: '5-Bedroom Luxury Detached House in Lekki Phase 1',
    description: 'Stunning fully-detached home in one of Lagos\'s most prestigious addresses. Features a private swimming pool, smart home automation, 3 living rooms, cinema room, and staff quarters. Generator, borehole, and 24/7 security included.',
    price: 450000000, type: 'house', status: 'available', bedrooms: 5, bathrooms: 6,
    city: 'Lagos', state: 'Lagos', address: '14 Admiralty Way, Lekki Phase 1',
    sqft: 6200, amenities: ['Swimming Pool', 'Smart Home', 'Generator', 'Cinema Room', 'CCTV', '24/7 Security', 'Borehole', 'Staff Quarters'],
  },
  {
    title: '3-Bedroom Serviced Apartment on Victoria Island',
    description: 'Premium fully-serviced apartment in a high-rise tower on Victoria Island. Floor-to-ceiling windows with ocean views, modern kitchen, concierge service, rooftop terrace, and dedicated underground parking.',
    price: 120000000, type: 'apartment', status: 'available', bedrooms: 3, bathrooms: 3,
    city: 'Lagos', state: 'Lagos', address: '7 Adeola Odeku Street, Victoria Island',
    sqft: 2400, amenities: ['Ocean View', 'Concierge', 'Rooftop Terrace', 'Underground Parking', 'Generator', 'Gym', 'Swimming Pool'],
  },
  {
    title: '4-Bedroom Semi-Detached Duplex in Ikoyi',
    description: 'Elegant semi-detached duplex in the heart of Ikoyi. Spacious open-plan living area, designer kitchen, en-suite bedrooms, private garden, and covered parking for 3 cars. Quiet street with low traffic.',
    price: 280000000, type: 'duplex', status: 'available', bedrooms: 4, bathrooms: 4,
    city: 'Lagos', state: 'Lagos', address: '22 Glover Road, Ikoyi',
    sqft: 4100, amenities: ['Private Garden', 'Designer Kitchen', 'Generator', 'Water Treatment', 'CCTV', 'Boys Quarters'],
  },
  {
    title: '2-Bedroom Apartment in Yaba Close to Tech Hub',
    description: 'Modern 2-bedroom apartment perfectly located steps from Yaba\'s booming tech district. Ideal for young professionals. Features fibre internet, contemporary finishes, backup generator, and a co-working lounge for residents.',
    price: 35000000, type: 'apartment', status: 'available', bedrooms: 2, bathrooms: 2,
    city: 'Lagos', state: 'Lagos', address: '5 Herbert Macaulay Way, Yaba',
    sqft: 1100, amenities: ['Fibre Internet', 'Generator', 'CCTV', 'Co-working Lounge', 'Intercom'],
  },
  {
    title: '3-Bedroom Terrace House in Ajah',
    description: 'Tastefully finished terrace house in a well-managed estate in Ajah. Great for families — close to schools, shopping centres, and the Lagos-Epe Expressway. Includes a private compound and ample parking.',
    price: 55000000, type: 'house', status: 'available', bedrooms: 3, bathrooms: 3,
    city: 'Lagos', state: 'Lagos', address: 'Seaside Estate, Ajah',
    sqft: 1800, amenities: ['Generator', 'Borehole', 'Security', 'CCTV', 'Parking'],
  },
  {
    title: '5-Bedroom Mansion in Maitama, Abuja',
    description: 'Grand mansion on a double plot in Maitama\'s most sought-after crescent. Features a guest chalet, executive home office, cinema, outdoor kitchen, and a landscaped garden. Suitable for senior executives and diplomats.',
    price: 380000000, type: 'house', status: 'available', bedrooms: 5, bathrooms: 7,
    city: 'Abuja', state: 'FCT', address: '3 Mambilla Crescent, Maitama',
    sqft: 7800, amenities: ['Swimming Pool', 'Cinema', 'Guest Chalet', 'Outdoor Kitchen', 'Garden', 'Generator', 'CCTV', 'Smart Home'],
  },
  {
    title: '4-Bedroom Detached House in Asokoro',
    description: 'Well-maintained 4-bedroom home in the quiet diplomatic zone of Asokoro. High ceilings, marble floors, fitted wardrobes, and a large compound with a garden. Close to the Transcorp Hilton and Aso Rock.',
    price: 180000000, type: 'house', status: 'pending', bedrooms: 4, bathrooms: 4,
    city: 'Abuja', state: 'FCT', address: '11 Parakou Crescent, Asokoro',
    sqft: 4500, amenities: ['Garden', 'Marble Floors', 'Generator', 'Borehole', 'CCTV', 'Boys Quarters'],
  },
  {
    title: '3-Bedroom Apartment in Wuse 2',
    description: 'Spacious serviced apartment in Wuse 2\'s commercial district. Fitted kitchen, tiled throughout, dedicated parking bay, and 24/7 power. Ideal for corporate lets or owner-occupiers wanting city convenience.',
    price: 75000000, type: 'apartment', status: 'available', bedrooms: 3, bathrooms: 3,
    city: 'Abuja', state: 'FCT', address: '45 Aminu Kano Crescent, Wuse 2',
    sqft: 2000, amenities: ['Generator', 'Intercom', 'Parking', 'CCTV', 'Security'],
  },
  {
    title: '4-Bedroom Terrace in Gwarinpa Estate',
    description: 'Affordable luxury in Gwarinpa — Abuja\'s largest residential estate. This well-built terrace features a BQ, car port, and access to estate amenities including a park, sports court, and primary school.',
    price: 65000000, type: 'house', status: 'available', bedrooms: 4, bathrooms: 3,
    city: 'Abuja', state: 'FCT', address: '7th Avenue, Gwarinpa Estate',
    sqft: 2600, amenities: ['BQ', 'Car Port', 'Estate Security', 'Park Access', 'Borehole'],
  },
  {
    title: '3-Bedroom Luxury Flat in GRA Port Harcourt',
    description: 'Beautifully finished apartment in the Port Harcourt GRA. Open-plan layout, Italian tiles, fitted kitchen, and a large balcony. Close to major oil companies and international schools.',
    price: 95000000, type: 'apartment', status: 'available', bedrooms: 3, bathrooms: 3,
    city: 'Port Harcourt', state: 'Rivers', address: '8 Douglas Road, GRA Phase 2',
    sqft: 2100, amenities: ['Generator', 'CCTV', 'Balcony', 'Security', 'Parking'],
  },
  {
    title: '5-Bedroom Duplex in Trans Amadi',
    description: 'Executive duplex in Trans Amadi\'s quiet residential pocket. Double compound, large living areas, fitted kitchen, and a rooftop lounge. Minutes from the airport and industrial hub.',
    price: 140000000, type: 'duplex', status: 'available', bedrooms: 5, bathrooms: 5,
    city: 'Port Harcourt', state: 'Rivers', address: '3 Trans Amadi Close, Port Harcourt',
    sqft: 4200, amenities: ['Rooftop Lounge', 'Double Compound', 'Generator', 'Water Treatment', 'CCTV'],
  },
  {
    title: '2-Bedroom Bungalow in Ibadan (Bodija)',
    description: 'Neat and affordable 2-bedroom bungalow in Bodija, one of Ibadan\'s premier residential areas. Tiled throughout, fitted with a modern bathroom and kitchen. Walking distance to UI Teaching Hospital.',
    price: 22000000, type: 'bungalow', status: 'available', bedrooms: 2, bathrooms: 2,
    city: 'Ibadan', state: 'Oyo', address: '18 Sanusi Fafunwa Street, Bodija',
    sqft: 980, amenities: ['Tiled', 'Security Door', 'Borehole', 'Parking'],
  },
  {
    title: '4-Bedroom Semi-Detached in New Bodija',
    description: 'Recently completed semi-detached home in New Bodija. Includes a BQ, tiled compound, and modern kitchen. Suitable for families relocating to Ibadan — excellent access to Ring Road and major schools.',
    price: 48000000, type: 'house', status: 'available', bedrooms: 4, bathrooms: 3,
    city: 'Ibadan', state: 'Oyo', address: '29 Olowolagba Street, New Bodija',
    sqft: 2100, amenities: ['BQ', 'Generator', 'Tiled Compound', 'Borehole', 'CCTV'],
  },
  {
    title: '3-Bedroom Apartment in GRA Enugu',
    description: 'Modern apartment in the well-planned Enugu GRA. Spacious rooms, quality fittings, backup power, and a serene environment. Close to the Government House and major banks.',
    price: 42000000, type: 'apartment', status: 'available', bedrooms: 3, bathrooms: 2,
    city: 'Enugu', state: 'Enugu', address: '12 Udi Street, GRA Enugu',
    sqft: 1600, amenities: ['Generator', 'Security', 'Parking', 'Borehole'],
  },
  {
    title: '4-Bedroom Detached Bungalow in Independence Layout, Enugu',
    description: 'Spacious fully-detached bungalow in one of Enugu\'s finest layouts. Excellent for retirement or family living — large compound with garden, double BQ, and a paved car park for 4 vehicles.',
    price: 68000000, type: 'bungalow', status: 'available', bedrooms: 4, bathrooms: 3,
    city: 'Enugu', state: 'Enugu', address: '6 Okpara Avenue, Independence Layout',
    sqft: 3000, amenities: ['Garden', 'Double BQ', 'Generator', 'Borehole', 'Paved Compound'],
  },
  {
    title: 'Penthouse on Victoria Island — 2 Floors',
    description: 'One-of-a-kind duplex penthouse occupying the top two floors of a prestige tower on VI. Private rooftop terrace with Lagos skyline views, chef\'s kitchen, home theatre, and a private elevator. Ultra-luxury finishes throughout.',
    price: 750000000, type: 'penthouse', status: 'available', bedrooms: 4, bathrooms: 5,
    city: 'Lagos', state: 'Lagos', address: 'Landmark Towers, Victoria Island',
    sqft: 5800, amenities: ['Private Rooftop', 'Private Elevator', 'Home Theatre', 'Chef\'s Kitchen', 'Smart Home', 'Concierge', 'Generator', 'Ocean View'],
  },
  {
    title: '6-Bedroom Detached House in Banana Island',
    description: 'Iconic waterfront home on Banana Island — Lagos\'s most exclusive address. Full smart home system, private jetty, infinity pool, and a 6-car garage. Unmatched security and privacy in a gated island community.',
    price: 1200000000, type: 'house', status: 'pending', bedrooms: 6, bathrooms: 8,
    city: 'Lagos', state: 'Lagos', address: 'Bourdillon Road, Banana Island, Ikoyi',
    sqft: 11000, amenities: ['Infinity Pool', 'Private Jetty', 'Smart Home', '6-Car Garage', 'Waterfront', 'Home Cinema', 'Gym', 'Staff Quarters'],
  },
  {
    title: '1-Bedroom Studio Apartment in Lekki Phase 2',
    description: 'Compact and stylish studio apartment — perfect for young professionals or as a rental investment. Contemporary kitchen, modern bathroom, and covered parking. Located on a serene street in Lekki Phase 2 with easy access to the Lekki-Epe Expressway.',
    price: 18000000, type: 'apartment', status: 'available', bedrooms: 1, bathrooms: 1,
    city: 'Lagos', state: 'Lagos', address: '33 Ogombo Road, Lekki Phase 2',
    sqft: 650, amenities: ['Generator', 'Intercom', 'CCTV', 'Parking'],
  },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Clear existing properties first
    await supabase.from('properties').delete().gte('id', 0);

    const { data, error } = await supabase
      .from('properties')
      .insert(listings.map(l => ({ ...l, images: [], agent_id: null, created_at: new Date().toISOString() })))
      .select();

    if (error) throw error;
    return res.status(200).json({ ok: true, count: data.length });
  } catch (err) {
    console.error('seedListings error:', err);
    return res.status(500).json({ error: err.message });
  }
}
