
require('dotenv').config();
const mongoose = require('mongoose');
const slugify = require('slugify');
const path = require('path');
const fs = require('fs');
const { v4: uuid4 } = require('uuid');

// Optional Cloudinary (only used if CLOUDINARY_* env vars exist)
let cloudinary = null;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Adjust paths if your project stores models elsewhere
const Category = require('../models/category.schema');
const Product = require('../models/product.schema');
const User = require('../models/user.schema');

const MONGO_URL = process.env.MONGO_URL;

// 20 Africa-relevant categories and 3+ realistic African farm or agro products per category
const CATEGORIES_AND_PRODUCTS = {
  "Roots & Tubers": ["Cassava (for Garri)", "Yam (White yam)", "Sweet Potato"],
  "Cereals & Grains": ["Maize (corn)", "Sorghum", "Millet"],
  "Pulses & Legumes": ["Cowpea (black-eyed peas)", "Groundnuts (peanuts)", "Bambara Groundnut"],
  "Fruits": ["Mango", "Plantain", "Pineapple"],
  "Vegetables": ["Okra", "Garden Egg (African Eggplant)", "Amaranth (Green)"],
  "Oil Crops & Oils": ["Oil Palm (crude palm oil)", "Groundnut Oil (peanut oil)", "Shea (shea butter)"] ,
  "Cash Crops": ["Cocoa (raw beans)", "Coffee (green beans)", "Cotton lint"],
  "Spices & Condiments": ["Ginger", "Turmeric", "Scotch Bonnet Pepper"],
  "Livestock": ["Goat (meat)", "Sheep (meat)", "Cattle (beef)"] ,
  "Poultry & Eggs": ["Chicken (broiler)", "Chicken eggs", "Guinea fowl"],
  "Fisheries": ["Tilapia (fresh)", "Catfish (fresh)", "Smoked fish"],
  "Nuts & Dried Fruits": ["Cashew nuts", "Dried mango slices", "Palm kernel"],
  "Dairy & Dairy Products": ["Fresh cow milk", "Local cheese (wara)", "Yogurt (local)"] ,
  "Processed Staples": ["Garri (fermented cassava)", "Fufu flour (cassava yam blends)", "Yam flour (elubo)"] ,
  "Organic Produce": ["Organic Tomatoes", "Organic Lettuce", "Organic Spinach"],
  "Beverages": ["Hibiscus (Zobo) dried calyces", "Local palm wine (bottle)", "Fresh sugarcane juice"],
  "Seeds & Seedlings": ["Maize seeds (hybrid)", "Cassava cuttings", "Vegetable seedlings (tomato)"],
  "Honey & Beekeeping": ["Raw honey (wild/bee farm)", "Beeswax", "Propolis"],
  "Flowers & Ornamentals": ["Sunflower heads", "Marigold bunches", "Bouquet - mixed local blooms"],
  "Other Prepared Foods": ["Dried plantain chips", "Roasted groundnuts", "Kilishi-style dried beef"]
};

// Realistic Nigerian farmer names (first + last). We'll create multiple farmer users from this list.
const FARMER_NAMES = [
  { firstName: 'Adekunle', lastName: 'Oluwole' },
  { firstName: 'Chinedu', lastName: 'Okonkwo' },
  { firstName: 'Aisha', lastName: 'Abubakar' },
  { firstName: 'Olufunke', lastName: 'Adebayo' },
  { firstName: 'Emeka', lastName: 'Nwosu' },
  { firstName: 'Nneka', lastName: 'Eze' },
  { firstName: 'Ibrahim', lastName: 'Sani' },
  { firstName: 'Fatima', lastName: 'Mohammed' },
  { firstName: 'Tunde', lastName: 'Balogun' },
  { firstName: 'Kemi', lastName: 'Ojo' }
];

function placeholderImageUrl(seed) {
  const id = Math.abs(seed.split('').reduce((s, c) => s + c.charCodeAt(0), 0)) % 1000;
  return `https://picsum.photos/seed/${id}/800/600`;
}

async function uploadLocalImageIfAny(categorySlug, filename) {
  if (!cloudinary) return null;
  const filePath = path.join(process.cwd(), 'seed_images', categorySlug, filename);
  if (!fs.existsSync(filePath)) return null;
  try {
    const res = await cloudinary.uploader.upload(filePath, {
      folder: process.env.CLOUDINARY_FOLDER || 'farmarket/seed',
      public_id: `${path.parse(filename).name}-${uuid4().slice(0,8)}`,
      resource_type: 'image'
    });
    return { url: res.secure_url, publicId: res.public_id, resourceType: res.resource_type };
  } catch (err) {
    console.warn('Cloudinary upload failed for', filePath, err.message || err);
    return null;
  }
}

(async function seed() {
  console.log('Connecting to DB...', MONGO_URL);
  await mongoose.connect(MONGO_URL);

  try {
    // create farmer users
    const farmers = [];
    for (let i = 0; i < FARMER_NAMES.length; i++) {
      const nm = FARMER_NAMES[i];
      const email = `${nm.firstName.toLowerCase()}.${nm.lastName.toLowerCase()}@example.com`;
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          firstName: nm.firstName,
          lastName: nm.lastName,
          email,
          password: 'password123', // meets minimum length
          role: 'farmer'
        });
        await user.save();
        console.log('Created farmer:', email);
      } else {
        console.log('Farmer exists:', email);
      }
      farmers.push(user);
    }

    // iterate categories
    for (const [catName, productList] of Object.entries(CATEGORIES_AND_PRODUCTS)) {
      const slug = slugify(catName, { lower: true, strict: true });
      let category = await Category.findOne({ slug });
      if (!category) {
        category = new Category({ name: catName, slug });
        await category.save();
        console.log('Created category:', catName);
      } else {
        console.log('Category exists, skipping:', catName);
      }

      // create 3 products (use provided list or generate if short)
      for (let i = 0; i < 3; i++) {
        const nameBase = productList[i % productList.length];
        const name = nameBase; // can append index if you want unique names
        const slug = slugify(name, { lower: true, strict: true });
        const existing = await Product.findOne({ slug, category: category._id });
        if (existing) {
          console.log('Product exists, skipping:', name);
          continue;
        }

        // pick a farmer owner (round-robin)
        const farmerUser = farmers[i % farmers.length];

        // images: try local -> cloudinary -> placeholder
        let images = [];
        if (cloudinary) {
          const catFolder = slugify(catName, { lower: true, strict: true });
          const seedDir = path.join(process.cwd(), 'seed_images', catFolder);
          if (fs.existsSync(seedDir)) {
            const files = fs.readdirSync(seedDir).filter(f => !f.startsWith('.'));
            if (files.length > 0) {
              const uploaded = await uploadLocalImageIfAny(catFolder, files[i % files.length]);
              if (uploaded) images.push(uploaded);
            }
          }
        }
        if (images.length === 0) {
          images.push({ url: placeholderImageUrl(name + '-' + catName), publicId: null, resourceType: 'image' });
        }

        const product = new Product({
          name,
          slug,
          description: `${name} — authentic ${catName.toLowerCase()} commonly produced in West Africa.`,
          category: category._id,
          farmer: farmerUser._id,
          quantity: Math.floor(Math.random() * 500) + 10,
          unit: 'kg',
          pricePerUnit: Math.floor(Math.random() * 2000) + 100,
          minimumOrderQuantity: { value: 1, unit: 'kg', enabled: false },
          images,
          status: 'is_active'
        });

        await product.save();
        console.log('Created product:', name, 'in', catName);
      }
    }

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();