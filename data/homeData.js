export const CATEGORIES = [
  { id: 'dine',    emoji: '🍽️', label: 'Dine-Out',          color: '#fff3e0' },
  { id: 'food',    emoji: '🛵',  label: 'Food\nDelivery',     color: '#e3f2fd' },
  { id: 'pharma',  emoji: '💊',  label: 'Pharmacy',           color: '#e8f5e9' },
  { id: 'beauty',  emoji: '💄',  label: 'Beauty &\nGrooming', color: '#fce4ec' },
  { id: 'fashion', emoji: '👗',  label: 'Fashion',            color: '#f3e5f5' },
  { id: 'night',   emoji: '🌙',  label: 'Nightlife',          color: '#ede7f6' },
  { id: 'online',  emoji: '🛒',  label: 'Online\nBrands',     color: '#e0f7fa' },
  { id: 'travel',  emoji: '🧳',  label: 'Travel',             color: '#fff8e1' },
];

export const BANNERS = [
  { id: '1', title: '60% + Flat ₹100 off', sub: 'On your next 5 deliveries', badge: '🏠 Home Delivery', colors: ['#1d3fad', '#0d47a1'], emojis: ['🍔', '🍟', '🥤'] },
  { id: '2', title: 'Buy 1 Get 1 Free',    sub: 'On all salon services today', badge: '💄 Beauty Deals',  colors: ['#7b2fcd', '#c03b8f'], emojis: ['💅', '💇', '🧖'] },
  { id: '3', title: 'Up to 50% off',       sub: 'Local restaurants near you',  badge: '🍛 Dine-Out',      colors: ['#e65100', '#f57c00'], emojis: ['🍛', '🍜', '🍱'] },
];

export const FLASH_DEALS = [
  { id: '1', name: 'Burger King',    off: '40%', emoji: '🍔', bg: ['#ff6f00', '#f57c00'] },
  { id: '2', name: 'Pizza Hut',      off: '30%', emoji: '🍕', bg: ['#c62828', '#e53935'] },
  { id: '3', name: 'KFC',            off: '25%', emoji: '🍗', bg: ['#827717', '#f9a825'] },
  { id: '4', name: 'Baskin Robbins', off: '20%', emoji: '🍦', bg: ['#ad1457', '#e91e63'] },
];

export const DEALS = [
  { id: '1', title: 'Entertainment', desc: 'Save up to 25%', color: ['#e8574a', '#f7a134'], emoji: '🎬' },
  { id: '2', title: 'Electronics',   desc: 'Save up to 40%', color: ['#2563eb', '#7b2fcd'], emoji: '📱' },
  { id: '3', title: 'Dining Out',    desc: 'Save up to 30%', color: ['#059669', '#0d9488'], emoji: '🍕' },
  { id: '4', title: 'Beauty Deals',  desc: 'Save up to 35%', color: ['#c03b8f', '#7b2fcd'], emoji: '💅' },
];

export const MEAL_TAGS = [
  { id: 'all',  label: 'All' },
  { id: 'brk',  label: 'Breakfast' },
  { id: 'lnch', label: 'Lunch' },
  { id: 'si',   label: 'South Indian' },
  { id: 'ch',   label: 'Chinese' },
  { id: 'din',  label: 'Dinner' },
  { id: 'bir',  label: 'Biryani' },
  { id: 'rol',  label: 'Rolls' },
  { id: 'swt',  label: 'Sweets' },
];

export const POPULAR_STORES = [
  { id: '1', name: 'Burger King',  dist: '2km', area: 'White Town',  rating: '4.2', tag: 'Budget Eats', emoji: '🍔', bg: '#fff3e0', open: true  },
  { id: '2', name: 'Pizza Hut',    dist: '2km', area: 'White Town',  rating: '4.5', tag: 'Popular',     emoji: '🍕', bg: '#fce4ec', open: true  },
  { id: '3', name: 'A2B',          dist: '1km', area: 'White Town',  rating: '4.1', tag: 'Veg Only',    emoji: '🍛', bg: '#e8f5e9', open: false },
  { id: '4', name: "McDonald's",   dist: '3km', area: 'Anna Nagar',  rating: '4.3', tag: 'Quick Bites', emoji: '🍟', bg: '#fff8e1', open: true  },
];

export const NEARBY_STORES = [
  { id: '1', name: 'The Red Box',    dist: '2km', area: 'White Town',    tag: 'Budget Eats', emoji: '🥡', rating: '4.0', open: true,  bg: '#fff3e0' },
  { id: '2', name: 'Pizza House',    dist: '2km', area: 'White Town',    tag: 'Budget Eats', emoji: '🍕', rating: '3.8', open: true,  bg: '#fce4ec' },
  { id: '3', name: 'KFC',            dist: '3km', area: 'Aruthra Nagar', tag: 'Quick Bites', emoji: '🍗', rating: '4.4', open: true,  bg: '#fff8e1' },
  { id: '4', name: 'House Café',     dist: '3km', area: 'Aruthra Nagar', tag: 'Café',        emoji: '☕', rating: '4.1', open: false, bg: '#e8f5e9' },
  { id: '5', name: "Domino's Pizza", dist: '3km', area: 'Anna Nagar',    tag: 'Quick Eats',  emoji: '🍕', rating: '4.2', open: true,  bg: '#e3f2fd' },
  { id: '6', name: 'Baskin Robbins', dist: '3km', area: 'Anna Nagar',    tag: 'Desserts',    emoji: '🍦', rating: '4.5', open: true,  bg: '#f3e5f5' },
];

export const TRENDING = [
  '🍔 Burgers', '🥗 Healthy', '🍕 Pizza', '🧁 Cakes', '💇 Salon',
  '🍜 Noodles', '☕ Coffee', '🍦 Ice Cream', '🥘 Biryani', '🎬 Movies',
];
