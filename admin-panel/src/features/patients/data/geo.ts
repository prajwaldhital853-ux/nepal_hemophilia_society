export const provinceDistricts: Record<string, string[]> = {
  Koshi: [
    "Taplejung",
    "Sankhuwasabha",
    "Solukhumbu",
    "Okhaldhunga",
    "Khotang",
    "Bhojpur",
    "Dhankuta",
    "Terhathum",
    "Panchthar",
    "Ilam",
    "Jhapa",
    "Morang",
    "Sunsari",
    "Udayapur",
  ],
  Madhesh: ["Saptari", "Siraha", "Dhanusha", "Mahottari", "Sarlahi", "Rautahat", "Bara", "Parsa"],
  Bagmati: [
    "Dolakha",
    "Ramechhap",
    "Sindhuli",
    "Kavrepalanchok",
    "Sindhupalchok",
    "Rasuwa",
    "Nuwakot",
    "Dhading",
    "Kathmandu",
    "Bhaktapur",
    "Lalitpur",
    "Makwanpur",
    "Chitwan",
  ],
  Gandaki: [
    "Gorkha",
    "Manang",
    "Mustang",
    "Myagdi",
    "Kaski",
    "Lamjung",
    "Tanahu",
    "Nawalpur",
    "Syangja",
    "Parbat",
    "Baglung",
  ],
  Lumbini: [
    "Kapilvastu",
    "Rupandehi",
    "Palpa",
    "Arghakhanchi",
    "Gulmi",
    "Parasi",
    "Dang",
    "Pyuthan",
    "Rolpa",
    "Eastern Rukum",
    "Banke",
    "Bardiya",
  ],
  Karnali: ["Dolpa", "Mugu", "Humla", "Jumla", "Kalikot", "Dailekh", "Jajarkot", "Western Rukum", "Salyan", "Surkhet"],
  Sudurpashchim: [
    "Bajura",
    "Bajhang",
    "Darchula",
    "Baitadi",
    "Dadeldhura",
    "Doti",
    "Achham",
    "Kailali",
    "Kanchanpur",
  ],
};

export const careCenters = [
  "Kathmandu Hemophilia Center",
  "TU Teaching Hospital",
  "Bhaktapur Treatment Center",
  "Lalitpur Hemophilia Clinic",
  "Hetauda Hemophilia Center",
  "Pokhara Hemophilia Center",
  "Biratnagar Hemophilia Center",
  "Janakpur Hemophilia Clinic",
  "Butwal Treatment Center",
  "Nepalgunj Hemophilia Center",
];

export const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

/** Split stored office address "street, District" back into fields for edit forms. */
export function splitOfficeAddress(stored: string, province: string) {
  const raw = (stored || "").trim();
  if (!raw) return { officeAddress: "", district: "" };
  const districts = provinceDistricts[province] ?? [];
  for (const name of districts) {
    const suffix = `, ${name}`;
    if (raw === name) return { officeAddress: "", district: name };
    if (raw.endsWith(suffix)) {
      return {
        officeAddress: raw.slice(0, -suffix.length).trim(),
        district: name,
      };
    }
  }
  return { officeAddress: raw, district: "" };
}
