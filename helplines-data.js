/**
 * Crisis & referral contacts for Upeo AI.
 * Verify numbers on official university / government sites; lines can change.
 */
window.UPEO_HELPLINES = {
  disclaimer: "Danger now? Call 999 or 112. Verify numbers on official sites when you can.",

  national: [
    {
      label: "GBV",
      numbers: ["1195"],
      hours: "Toll-free",
      note: "Referrals nationwide.",
    },
    {
      label: "Police",
      numbers: ["999", "112"],
      hours: "24/7",
      note: "Emergency.",
    },
    {
      label: "Childline",
      numbers: ["116"],
      hours: "24/7",
      note: "Children & youth.",
    },
  ],

  usiu: {
    title: "USIU-Africa · GBV",
    subtitle: "For students: confidential support and referrals.",
    lines: [
      {
        label: "Office Mon–Fri 8–5",
        numbers: ["+254 730 116 282", "+254 730 116 283", "+254 730 116 284", "+254 730 116 285"],
      },
      {
        label: "24/7",
        numbers: ["+254 782 539 361"],
      },
    ],
    web: { label: "usiu.ac.ke", href: "https://www.usiu.ac.ke/" },
    promises: ["Confidential", "Crisis support", "Referrals"],
  },

  /** All 47 counties—local desks vary; 1195 routes referrals nationwide. */
  counties: [
    { name: "Baringo" },
    { name: "Bomet" },
    { name: "Bungoma" },
    { name: "Busia" },
    { name: "Elgeyo-Marakwet" },
    { name: "Embu" },
    { name: "Garissa" },
    { name: "Homa Bay" },
    { name: "Isiolo" },
    { name: "Kajiado" },
    { name: "Kakamega" },
    { name: "Kericho" },
    { name: "Kiambu" },
    { name: "Kilifi" },
    { name: "Kirinyaga" },
    { name: "Kisii" },
    { name: "Kisumu" },
    { name: "Kitui" },
    { name: "Kwale" },
    { name: "Laikipia" },
    { name: "Lamu" },
    { name: "Machakos" },
    { name: "Makueni" },
    { name: "Mandera" },
    { name: "Marsabit" },
    { name: "Meru" },
    { name: "Migori" },
    { name: "Mombasa" },
    { name: "Murang'a" },
    { name: "Nairobi" },
    { name: "Nakuru" },
    { name: "Nandi" },
    { name: "Narok" },
    { name: "Nyamira" },
    { name: "Nyandarua" },
    { name: "Nyeri" },
    { name: "Samburu" },
    { name: "Siaya" },
    { name: "Taita-Taveta" },
    { name: "Tana River" },
    { name: "Tharaka-Nithi" },
    { name: "Trans Nzoia" },
    { name: "Turkana" },
    { name: "Uasin Gishu" },
    { name: "Vihiga" },
    { name: "Wajir" },
    { name: "West Pokot" },
  ],
};
