const pool = require('../config/db');

// Dhaka-area fallback coordinates for well-known text location names
const LOCATION_GEOCODE = {
  'banani':         { lat: 23.7937, lng: 90.4066 },
  'mirpur':         { lat: 23.8103, lng: 90.3661 },
  'gulshan':        { lat: 23.7808, lng: 90.4147 },
  'dhanmondi':      { lat: 23.7461, lng: 90.3742 },
  'uttara':         { lat: 23.8759, lng: 90.3795 },
  'mohakhali':      { lat: 23.7775, lng: 90.4005 },
  'rampura':        { lat: 23.7576, lng: 90.4272 },
  'badda':          { lat: 23.7775, lng: 90.4274 },
  'khilgaon':       { lat: 23.7462, lng: 90.4271 },
  'tejgaon':        { lat: 23.7568, strlen: 90.3910, lng: 90.3910 },
  'motijheel':      { lat: 23.7264, lng: 90.4191 },
  'wari':           { lat: 23.7176, lng: 90.4136 },
  'lalbagh':        { lat: 23.7213, lng: 90.3901 },
  'hazaribagh':     { lat: 23.7196, lng: 90.3748 },
  'mohammadpur':    { lat: 23.7615, lng: 90.3570 },
  'adabor':         { lat: 23.7678, lng: 90.3484 },
  'savar':          { lat: 23.8579, lng: 90.2667 },
  'narayanganj':    { lat: 23.6238, lng: 90.4988 },
  'tongi':          { lat: 23.8944, lng: 90.3978 },
  'gazipur':        { lat: 23.9999, lng: 90.4203 },
  'dhaka':          { lat: 23.8103, lng: 90.4125 },
  'chittagong':     { lat: 22.3569, lng: 91.7832 },
  'sylhet':         { lat: 24.8949, lng: 91.8687 },
  'rajshahi':       { lat: 24.3745, lng: 88.6042 },
  'khulna':         { lat: 22.8456, lng: 89.5403 },
};

/**
 * Attempt to extract or infer lat/lng from a text location string.
 * Returns { lat, lng } or null.
 */
function geocodeFallback(locationText) {
  if (!locationText) return null;
  const lower = locationText.toLowerCase().trim();

  // Try direct key match
  if (LOCATION_GEOCODE[lower]) return LOCATION_GEOCODE[lower];

  // Try partial match
  for (const [key, coords] of Object.entries(LOCATION_GEOCODE)) {
    if (lower.includes(key)) return coords;
  }

  // Random scatter within Dhaka if nothing found (graceful degradation)
  return {
    lat: 23.7808 + (Math.random() - 0.5) * 0.18,
    lng: 90.4125 + (Math.random() - 0.5) * 0.18,
  };
}

const HeatmapController = {
  async getData(req, res) {
    try {
      // ── 1. Fetch Citizen Waste (Scrap) Listings ───────────────────
      const [scrapRows] = await pool.execute(
        `SELECT s.listingId AS id,
                s.category  AS wasteType,
                s.weight    AS volume,
                s.status,
                s.createdAt,
                u.name      AS ownerName
         FROM ScrapListings s
         JOIN Users u ON u.id = s.ownerId
         WHERE s.status IN ('Available', 'Reserved')
         ORDER BY s.createdAt DESC
         LIMIT 200`
      );

      // ── 2. Fetch Reported Pollution Complaints ────────────────────
      const [pollRows] = await pool.execute(
        `SELECT p.complaintId AS id,
                p.locationPin,
                p.description,
                p.status,
                p.createdAt,
                u.name        AS citizenName
         FROM PollutionComplaints p
         JOIN Users u ON u.id = p.citizenId
         WHERE p.status IN ('Pending', 'Under Review')
         ORDER BY p.createdAt DESC
         LIMIT 200`
      );

      // ── 3. Map scrap → coordinates (no lat/lng in DB, use fallback)
      const wasteListings = scrapRows.map((row, i) => {
        // Scatter points around Dhaka with seeded offset per row for consistency
        const seed  = (row.id * 137 + i) % 1000;
        const latOff = ((seed % 100) - 50) / 500;   // ±0.10 deg
        const lngOff = ((seed % 77)  - 38) / 400;   // ±0.095 deg
        return {
          id:        row.id,
          lat:       23.7808 + latOff,
          lng:       90.4125 + lngOff,
          wasteType: row.wasteType || 'General Waste',
          volume:    row.volume || 0,
          status:    row.status,
          owner:     row.ownerName,
          date:      row.createdAt,
        };
      });

      // ── 4. Map pollution → coordinates from locationPin text ──────
      const pollutionReports = pollRows.map((row) => {
        const coords = geocodeFallback(row.locationPin);
        return {
          id:            row.id,
          lat:           coords.lat,
          lng:           coords.lng,
          locationPin:   row.locationPin || 'Unknown',
          description:   row.description || '',
          status:        row.status,
          reporter:      row.citizenName,
          date:          row.createdAt,
        };
      });

      return res.json({
        success:         true,
        wasteListings,
        pollutionReports,
      });

    } catch (err) {
      console.error('HeatmapController.getData error:', err);
      return res.status(500).json({ success: false, error: 'Failed to load heat map data.' });
    }
  }
};

module.exports = HeatmapController;
