import { db } from "./db";

export async function seedIfNeeded() {
  try {
    const roomCount = await db.rooms.count();
    const activityCount = await db.activities.count();

    if (roomCount === 0) {
      console.log("Seeding rooms...");
      await db.rooms.createMany({
        data: [
          {
            title: "Presidential Penthouse Suite",
            description: "Experience the height of luxury. Features a private infinity plunge pool, 360-degree panoramic views of the valley, a personalized butler service, private dining room, and state-of-the-art entertainment lounge.",
            price_per_night: 850.00,
            capacity: 4,
            status: "available",
            image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800",
          },
          {
            title: "Royal Garden Villa",
            description: "Nestled in our lush botanical gardens. Offers complete privacy, a personal hot tub on a private deck, outdoor shower, and a spacious living area adorned with fine local craftsmanship.",
            price_per_night: 620.00,
            capacity: 3,
            status: "available",
            image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800",
          },
          {
            title: "Executive Panoramic Suite",
            description: "Perfect blend of business and leisure. Features a spacious work desk, high-speed fiber internet, a luxurious king bed, deep soaking tub, and floor-to-ceiling windows showing the rising sun.",
            price_per_night: 350.00,
            capacity: 2,
            status: "available",
            image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=800",
          },
          {
            title: "Deluxe Valley Room",
            description: "Unwind in comfort. A finely detailed bedroom featuring premium Egyptian cotton linens, a private balcony overlooking the resort's waterfalls, and premium coffee amenities.",
            price_per_night: 220.00,
            capacity: 2,
            status: "available",
            image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800",
          },
        ],
      });
    }

    if (activityCount === 0) {
      console.log("Seeding activities...");
      await db.activities.createMany({
        data: [
          {
            title: "Therapeutic Himalayan Spa Ritual",
            description: "Indulge in a relaxing deep-tissue massage featuring natural herbal oils imported from the Himalayas. Concludes with a private steam bath and botanical tea session.",
            category: "Wellness",
            price: 120.00,
            capacity: 6,
            duration: 90,
            status: "available",
            image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
          },
          {
            title: "Guided Valley Mountain Trekking",
            description: "A spectacular journey through forest trails led by our certified local naturalist. Includes premium trail snack packs, bird watching, and panoramic summit pictures.",
            category: "Adventure",
            price: 55.00,
            capacity: 15,
            duration: 180,
            status: "available",
            image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=800",
          },
          {
            title: "Private Lake Sunset Cruise",
            description: "Sail on our peaceful resort lake during golden hour. Includes a private captain, high-end charcuterie board, premium sparkling beverages, and live acoustic violin performance.",
            category: "Leisure",
            price: 240.00,
            capacity: 6,
            duration: 120,
            status: "available",
            image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800",
          },
          {
            title: "Gourmet Culinary Masterclass",
            description: "Learn secret culinary techniques from our Michelin-trained executive chef. You will prepare a premium 3-course organic meal utilizing ingredients freshly harvested from our resort garden.",
            category: "Gastronomy",
            price: 95.00,
            capacity: 10,
            duration: 150,
            status: "available",
            image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800",
          },
        ],
      });
    }
  } catch (error) {
    console.error("Seeding error:", error);
  }
}
