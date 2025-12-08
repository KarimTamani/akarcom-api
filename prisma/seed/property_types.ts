import { PrismaClient  } from '@prisma/client'
const prisma = new PrismaClient();

const propertyTypes = [
  // Residential parent
  { id: 1, name: "Residential", name_fr: "Résidentiel", name_ar: "سكنية", parent_id: null },
  { id: 2, name: "Apartments", name_fr: "Appartements", name_ar: "شقق", parent_id: 1 },
  { id: 3, name: "Villas", name_fr: "Villas", name_ar: "فلل", parent_id: 1 },
  { id: 4, name: "Houses", name_fr: "Maisons", name_ar: "منازل", parent_id: 1 },
  { id: 5, name: "Duplex", name_fr: "Duplex", name_ar: "دوبلكس", parent_id: 1 },
  { id: 6, name: "Studio", name_fr: "Studio", name_ar: "استوديو", parent_id: 1 },
  { id: 7, name: "Traditional House", name_fr: "Maison Traditionnelle", name_ar: "بيت شعبي", parent_id: 1 },

  // Commercial parent
  { id: 8, name: "Commercial", name_fr: "Commercial", name_ar: "تجارية", parent_id: null },
  { id: 9, name: "Shops", name_fr: "Magasins", name_ar: "محلات", parent_id: 8 },
  { id: 10, name: "Offices", name_fr: "Bureaux", name_ar: "مكاتب", parent_id: 8 },
  { id: 11, name: "Warehouses", name_fr: "Entrepôts", name_ar: "مستودعات", parent_id: 8 },
  { id: 12, name: "Showrooms", name_fr: "Salles d’exposition", name_ar: "معارض", parent_id: 8 },
  { id: 13, name: "Hotels", name_fr: "Hôtels", name_ar: "فنادق", parent_id: 8 },

  // Lands parent
  { id: 14, name: "Lands", name_fr: "Terrains", name_ar: "أراضي", parent_id: null },
  { id: 15, name: "Agricultural", name_fr: "Agricole", name_ar: "زراعية", parent_id: 14 },
  { id: 16, name: "Residential", name_fr: "Résidentiel", name_ar: "سكنية", parent_id: 14 },
  { id: 17, name: "Industrial", name_fr: "Industriel", name_ar: "صناعية", parent_id: 14 },
  { id: 18, name: "Commercial", name_fr: "Commercial", name_ar: "تجارية", parent_id: 14 },

  // Other parent
  { id: 19, name: "Other", name_fr: "Autres", name_ar: "أخرى", parent_id: null },
  { id: 20, name: "Farm", name_fr: "Ferme", name_ar: "مزرعة", parent_id: 19 },
  { id: 21, name: "Factory", name_fr: "Usine", name_ar: "مصنع", parent_id: 19 },
  { id: 22, name: "Real Estate Project", name_fr: "Projet Immobilier", name_ar: "مشروع عقاري", parent_id: 19 },
  { id: 23, name: "Investment Units", name_fr: "Unités d’investissement", name_ar: "وحدات استثمارية", parent_id: 19 },
];

async function main() {

    // Example: create sample users
    await prisma.property_types.createMany({
        data: propertyTypes
    })
}



main().then(() => {
    console.log("Property tpes seeded")
    process.exit(0)
}).catch((e) => {
    console.error("Failed to seed property types : ", e);
    process.exit(1)

})