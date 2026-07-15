// ═══════════════════════════════════════════════════════════════
// NexaStore — Database Seed Script
// Populates default administrative accounts, categories, brands, shipping zones, and pages
// ═══════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ─── 1. Super Admin User ────────────────────────────────────
  const adminEmail = 'admin@nexastore.com';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!admin) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin@123456', salt);

    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        isVerified: true,
      },
    });
    console.log('✅ Created Super Admin User: admin@nexastore.com / Admin@123456');
  }

  // Create default wallet & wishlist for admin
  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, balance: 1000 },
  });

  await prisma.wishlist.create({
    data: { userId: admin.id, name: 'My Wishlist', isDefault: true },
  }).catch(() => {});

  // ─── 2. Categories ──────────────────────────────────────────
  console.log('Creating categories...');
  const categoriesData = [
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Gadgets, phones, laptops, and more',
      isFeatured: true,
      subcategories: ['Smartphones', 'Laptops', 'Audio & Headphones', 'Smartwatches'],
    },
    {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Men, women, and kids apparel',
      isFeatured: true,
      subcategories: ['Mens Clothing', 'Womens Clothing', 'Footwear', 'Accessories'],
    },
    {
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Furniture, kitchenware, and decor',
      isFeatured: true,
      subcategories: ['Furniture', 'Cookware', 'Home Decor', 'Smart Home Appliances'],
    },
    {
      name: 'Beauty & Personal Care',
      slug: 'beauty-personal-care',
      description: 'Skincare, makeup, and grooming products',
      isFeatured: false,
      subcategories: ['Skincare', 'Haircare', 'Makeup', 'Fragrances'],
    },
    {
      name: 'Sports & Outdoors',
      slug: 'sports-outdoors',
      description: 'Fitness, gym gear, and outdoor adventures',
      isFeatured: false,
      subcategories: ['Fitness Equipment', 'Outdoor Gear', 'Athletic Wear', 'Cycling'],
    },
  ];

  for (let i = 0; i < categoriesData.length; i++) {
    const cat = categoriesData[i];
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, isFeatured: cat.isFeatured },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isFeatured: cat.isFeatured,
        sortOrder: i,
      },
    });

    for (let j = 0; j < cat.subcategories.length; j++) {
      const subName = cat.subcategories[j];
      const subSlug = `${cat.slug}-${subName.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-')}`;
      await prisma.category.upsert({
        where: { slug: subSlug },
        update: {},
        create: {
          name: subName,
          slug: subSlug,
          parentId: category.id,
          level: 1,
          sortOrder: j,
        },
      });
    }
  }
  console.log('✅ Categories and subcategories seeded.');

  // ─── 3. Brands ──────────────────────────────────────────────
  console.log('Creating brands...');
  const brands = [
    { name: 'Apple', slug: 'apple', isFeatured: true },
    { name: 'Samsung', slug: 'samsung', isFeatured: true },
    { name: 'Nike', slug: 'nike', isFeatured: true },
    { name: 'Sony', slug: 'sony', isFeatured: true },
    { name: 'Xiaomi', slug: 'xiaomi', isFeatured: false },
    { name: 'Adidas', slug: 'adidas', isFeatured: false },
    { name: 'Dell', slug: 'dell', isFeatured: false },
    { name: 'IKEA', slug: 'ikea', isFeatured: false },
    { name: 'Loreal', slug: 'loreal', isFeatured: false },
    { name: 'LG', slug: 'lg', isFeatured: false },
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: { isFeatured: brand.isFeatured },
      create: brand,
    });
  }
  console.log('✅ Brands seeded.');

  // ─── 4. Shipping Methods ────────────────────────────────────
  console.log('Creating shipping methods...');
  const shippingMethods = [
    { name: 'Standard Shipping', code: 'STD', baseRate: 4.99, freeShippingThreshold: 50.00, estimatedDays: '3-5 business days' },
    { name: 'Express Shipping', code: 'EXP', baseRate: 14.99, freeShippingThreshold: 150.00, estimatedDays: '1-2 business days' },
    { name: 'Free Shipping', code: 'FREE', baseRate: 0.00, freeShippingThreshold: 0.00, estimatedDays: '5-7 business days', isActive: false },
  ];

  for (const method of shippingMethods) {
    await prisma.shippingMethod.upsert({
      where: { code: method.code },
      update: { baseRate: method.baseRate, estimatedDays: method.estimatedDays },
      create: method,
    });
  }
  console.log('✅ Shipping methods seeded.');

  // ─── 5. Tax Rates ───────────────────────────────────────────
  console.log('Creating tax rates...');
  const taxRates = [
    { name: 'US Standard Sales Tax', rate: 0.0825, country: 'US' },
    { name: 'UK VAT', rate: 0.2000, country: 'GB' },
    { name: 'EU Standard VAT', rate: 0.1900, country: 'DE' },
  ];

  for (const tax of taxRates) {
    await prisma.taxRate.create({
      data: tax,
    }).catch(() => {});
  }
  console.log('✅ Tax rates seeded.');

  // ─── 6. CMS Pages ───────────────────────────────────────────
  console.log('Creating static CMS pages...');
  const pages = [
    { title: 'About Us', slug: 'about', content: '<h1>About NexaStore</h1><p>Welcome to NexaStore, your number one source for all things. We are dedicated to giving you the very best of product catalog, with a focus on dependability, customer service and uniqueness.</p>' },
    { title: 'Privacy Policy', slug: 'privacy', content: '<h1>Privacy Policy</h1><p>We respect your privacy and are committed to protecting it. This privacy policy explains our practices regarding the collection and use of user information.</p>' },
    { title: 'Terms & Conditions', slug: 'terms', content: '<h1>Terms & Conditions</h1><p>Please read these Terms and Conditions carefully before using the NexaStore website operated by us.</p>' },
    { title: 'Contact Us', slug: 'contact', content: '<h1>Contact Us</h1><p>If you have any questions, feel free to contact us at support@nexastore.com.</p>' },
  ];

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: { content: page.content },
      create: { ...page, status: 'PUBLISHED' },
    });
  }
  console.log('✅ Static pages seeded.');

  // ─── 7. FAQs ────────────────────────────────────────────────
  console.log('Creating FAQs...');
  const faqs = [
    { question: 'What is the return policy?', answer: 'We offer a 30-day money-back guarantee for most physical products returned in their original packaging.', category: 'General' },
    { question: 'Do you ship internationally?', answer: 'Yes, we ship to over 100 countries worldwide. Shipping fees and times vary by country.', category: 'Shipping' },
    { question: 'How can I track my order?', answer: 'Once your order ships, we will send an email with a tracking number and link to track your package.', category: 'Orders' },
  ];

  for (const faq of faqs) {
    await prisma.faq.create({ data: faq }).catch(() => {});
  }
  console.log('✅ FAQs seeded.');

  // ─── 8. Default Warehouse ───────────────────────────────────
  console.log('Creating default warehouse...');
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'NYC-MAIN' },
    update: {},
    create: {
      name: 'Main NYC Warehouse',
      code: 'NYC-MAIN',
      address: '100 Broadway',
      city: 'New York',
      state: 'NY',
      country: 'US',
      zipCode: '10005',
    },
  });
  console.log('✅ Warehouse NYC-MAIN created.');

  // ─── 9. Seed Products & Variants ───────────────────────────
  console.log('Creating sample products...');
  
  // Helper to fetch Category & Brand IDs
  const getCatId = async (slug: string) => (await prisma.category.findUnique({ where: { slug } }))?.id;
  const getBrandId = async (slug: string) => (await prisma.brand.findUnique({ where: { slug } }))?.id;

  const catSmartphones = await getCatId('electronics-smartphones');
  const catHeadphones = await getCatId('electronics-audio-headphones');
  const catMensClothing = await getCatId('fashion-mens-clothing');

  const brandApple = await getBrandId('apple');
  const brandSamsung = await getBrandId('samsung');
  const brandSony = await getBrandId('sony');
  const brandNike = await getBrandId('nike');

  if (catSmartphones && brandApple) {
    // 1. iPhone 15 Pro Max
    const product = await prisma.product.upsert({
      where: { sku: 'IPHONE15PM' },
      update: {},
      create: {
        name: 'iPhone 15 Pro Max',
        slug: 'iphone-15-pro-max',
        description: 'iPhone 15 Pro Max has a strong and light aerospace-grade titanium design. Powered by A17 Pro chip for outstanding mobile performance. Features a versatile 48MP main camera and 5x Telephoto camera.',
        shortDescription: 'Titanium design, A17 Pro chip, 48MP main camera.',
        sku: 'IPHONE15PM',
        basePrice: 1199.99,
        salePrice: 1199.99,
        categoryId: catSmartphones,
        brandId: brandApple,
        isFeatured: true,
        isNewArrival: true,
        status: 'ACTIVE',
        type: 'PHYSICAL',
        tags: ['apple', 'iphone', 'smartphone', 'electronics'],
      },
    });

    const v1 = await prisma.productVariant.upsert({
      where: { sku: 'IP15PM-256-BLK' },
      update: {},
      create: {
        productId: product.id,
        sku: 'IP15PM-256-BLK',
        name: 'iPhone 15 Pro Max - 256GB Black',
        price: 1199.99,
        stock: 50,
        isDefault: true,
        isActive: true,
      },
    });

    const v2 = await prisma.productVariant.upsert({
      where: { sku: 'IP15PM-512-BLK' },
      update: {},
      create: {
        productId: product.id,
        sku: 'IP15PM-512-BLK',
        name: 'iPhone 15 Pro Max - 512GB Black',
        price: 1399.99,
        stock: 30,
        isDefault: false,
        isActive: true,
      },
    });

    // Create primary images
    await prisma.productImage.createMany({
      data: [
        { productId: product.id, variantId: v1.id, url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80', isPrimary: true, sortOrder: 0 },
        { productId: product.id, variantId: v2.id, url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80', isPrimary: false, sortOrder: 1 },
      ],
    }).catch(() => {});

    // Create inventory
    await prisma.inventoryItem.upsert({
      where: { variantId_warehouseId: { variantId: v1.id, warehouseId: warehouse.id } },
      update: { quantity: 50 },
      create: { variantId: v1.id, warehouseId: warehouse.id, quantity: 50 },
    });
    await prisma.inventoryItem.upsert({
      where: { variantId_warehouseId: { variantId: v2.id, warehouseId: warehouse.id } },
      update: { quantity: 30 },
      create: { variantId: v2.id, warehouseId: warehouse.id, quantity: 30 },
    });
  }

  if (catSmartphones && brandSamsung) {
    // 2. Samsung S24 Ultra
    const product = await prisma.product.upsert({
      where: { sku: 'GALAXYS24U' },
      update: {},
      create: {
        name: 'Samsung Galaxy S24 Ultra',
        slug: 'galaxy-s24-ultra',
        description: 'Galaxy S24 Ultra is powered by Galaxy AI, offering smart search tools, live call translations, and enhanced photography tools. Featuring a titanium frame and Snapdragon 8 Gen 3 processor.',
        shortDescription: 'Galaxy AI, Titanium frame, Snapdragon 8 Gen 3.',
        sku: 'GALAXYS24U',
        basePrice: 1299.99,
        salePrice: 1299.99,
        categoryId: catSmartphones,
        brandId: brandSamsung,
        isFeatured: true,
        isNewArrival: true,
        status: 'ACTIVE',
        type: 'PHYSICAL',
        tags: ['samsung', 'galaxy', 'smartphone', 'electronics'],
      },
    });

    const v1 = await prisma.productVariant.upsert({
      where: { sku: 'S24U-256-TIT' },
      update: {},
      create: {
        productId: product.id,
        sku: 'S24U-256-TIT',
        name: 'Galaxy S24 Ultra - 256GB Titanium Gray',
        price: 1299.99,
        stock: 40,
        isDefault: true,
        isActive: true,
      },
    });

    await prisma.productImage.createMany({
      data: [
        { productId: product.id, variantId: v1.id, url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80', isPrimary: true, sortOrder: 0 },
      ],
    }).catch(() => {});

    await prisma.inventoryItem.upsert({
      where: { variantId_warehouseId: { variantId: v1.id, warehouseId: warehouse.id } },
      update: { quantity: 40 },
      create: { variantId: v1.id, warehouseId: warehouse.id, quantity: 40 },
    });
  }

  if (catHeadphones && brandSony) {
    // 3. Sony Headphones
    const product = await prisma.product.upsert({
      where: { sku: 'SONYXM5' },
      update: {},
      create: {
        name: 'Sony WH-1000XM5 Wireless Headphones',
        slug: 'sony-wh-1000xm5',
        description: 'The WH-1000XM5 headphones rewrite the rules of distraction-free listening. Industry-leading Noise Cancelling with 2 processors, 8 microphones, and Auto NC Optimizer. High-resolution audio support.',
        shortDescription: 'Industry-leading noise cancelling wireless headphones.',
        sku: 'SONYXM5',
        basePrice: 399.99,
        salePrice: 349.99,
        categoryId: catHeadphones,
        brandId: brandSony,
        isFeatured: true,
        status: 'ACTIVE',
        type: 'PHYSICAL',
        tags: ['sony', 'headphones', 'audio', 'wireless'],
      },
    });

    const v1 = await prisma.productVariant.upsert({
      where: { sku: 'XM5-BLK' },
      update: {},
      create: {
        productId: product.id,
        sku: 'XM5-BLK',
        name: 'Sony WH-1000XM5 Black',
        price: 349.99,
        stock: 100,
        isDefault: true,
        isActive: true,
      },
    });

    await prisma.productImage.createMany({
      data: [
        { productId: product.id, variantId: v1.id, url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', isPrimary: true, sortOrder: 0 },
      ],
    }).catch(() => {});

    await prisma.inventoryItem.upsert({
      where: { variantId_warehouseId: { variantId: v1.id, warehouseId: warehouse.id } },
      update: { quantity: 100 },
      create: { variantId: v1.id, warehouseId: warehouse.id, quantity: 100 },
    });
  }

  if (catMensClothing && brandNike) {
    // 4. Nike Jacket
    const product = await prisma.product.upsert({
      where: { sku: 'NIKEWR' },
      update: {},
      create: {
        name: 'Nike Windrunner Jacket',
        slug: 'nike-windrunner-jacket',
        description: 'The Nike Sportswear Windrunner Jacket updates our first running windbreaker with lightweight, weather-resistant fabric. Design lines drawn from the original style showcase heritage Nike styling.',
        shortDescription: 'Heritage Nike running windbreaker design.',
        sku: 'NIKEWR',
        basePrice: 99.99,
        salePrice: 89.99,
        categoryId: catMensClothing,
        brandId: brandNike,
        isFeatured: true,
        status: 'ACTIVE',
        type: 'PHYSICAL',
        tags: ['nike', 'jacket', 'clothing', 'fashion'],
      },
    });

    const v1 = await prisma.productVariant.upsert({
      where: { sku: 'NKWR-L' },
      update: {},
      create: {
        productId: product.id,
        sku: 'NKWR-L',
        name: 'Nike Windrunner - L',
        price: 89.99,
        stock: 60,
        isDefault: true,
        isActive: true,
      },
    });

    const v2 = await prisma.productVariant.upsert({
      where: { sku: 'NKWR-M' },
      update: {},
      create: {
        productId: product.id,
        sku: 'NKWR-M',
        name: 'Nike Windrunner - M',
        price: 89.99,
        stock: 80,
        isDefault: false,
        isActive: true,
      },
    });

    await prisma.productImage.createMany({
      data: [
        { productId: product.id, variantId: v1.id, url: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80', isPrimary: true, sortOrder: 0 },
      ],
    }).catch(() => {});

    await prisma.inventoryItem.upsert({
      where: { variantId_warehouseId: { variantId: v1.id, warehouseId: warehouse.id } },
      update: { quantity: 60 },
      create: { variantId: v1.id, warehouseId: warehouse.id, quantity: 60 },
    });
    await prisma.inventoryItem.upsert({
      where: { variantId_warehouseId: { variantId: v2.id, warehouseId: warehouse.id } },
      update: { quantity: 80 },
      create: { variantId: v2.id, warehouseId: warehouse.id, quantity: 80 },
    });
  }

  console.log('✅ Sample products and variants seeded.');

  console.log('🌱 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
