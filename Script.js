
const SUPABASE_URL = "https://nsjgrndgeviravyjjbty.supabase.co";
const SUPABASE_KEY = "sb_publishable_0-U6deQ9_Gedm4zJ8grLqg_DZpTrNUv";

let db;
let products = [];
let cart = [];
let activeFilter = "all";

const productsBox = document.getElementById("products");
const cartCount = document.getElementById("cart-count");
const floatingCount = document.getElementById("floating-count");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");

function loadSupabase() {
  return new Promise((resolve, reject) => {
    if (window.supabase) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function categoryKey(category) {
  const value = String(category || "").toLowerCase();

  if (value.includes("shoe") || value.includes("կոշիկ")) return "shoes";
  if (value.includes("bottom") || value.includes("տաբատ")) return "bottoms";
  if (value.includes("accessor") || value.includes("աքսեսուար")) return "accessories";
  if (value.includes("top") || value.includes("վերնազգեստ")) return "tops";

  return value;
}

function money(value) {
  return Number(value || 0).toLocaleString("hy-AM") + " ֏";
}

function showMessage(message) {
  productsBox.innerHTML = "";
  const p = document.createElement("p");
  p.textContent = message;
  productsBox.appendChild(p);
}

async function loadProducts() {
  showMessage("Ապրանքները բեռնվում են...");

  try {
    const { data, error } = await db
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    products = data || [];
    renderProducts();
  } catch (error) {
    console.error("Products error:", error);
    showMessage("Ապրանքները բեռնել չհաջողվեց։ Խնդրում ենք փորձել ավելի ուշ։");
  }
}

function renderProducts() {
  productsBox.innerHTML = "";

  const filtered = products.filter(product => {
    return activeFilter === "all" ||
      categoryKey(product.category) === activeFilter;
  });

  if (!filtered.length) {
    showMessage("Այս բաժնում դեռ ապրանքներ չկան։");
    return;
  }

  filtered.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const image = document.createElement("img");
    image.className = "product-image";
    image.alt = product.name || "LÈORA YVN ապրանք";
    image.src = product.image_url || "";
    image.loading = "lazy";

    if (!product.image_url) {
      image.style.display = "none";
    }

    const info = document.createElement("div");
    info.className = "product-info";

    const category = document.createElement("p");
    category.className = "product-category";
    category.textContent = product.category || "LÈORA YVN";

    const name = document.createElement("h3");
    name.className = "product-name";
    name.textContent = product.name || "Ապրանք";

    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = product.description || "";

    const sizes = document.createElement("p");
    sizes.className = "product-sizes";
    sizes.textContent = Array.isArray(product.sizes) && product.sizes.length
      ? "Չափսեր՝ " + product.sizes.join(", ")
      : "";

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = money(product.price);

    const button = document.createElement("button");
    button.className = "button light";
    button.textContent = "Ավելացնել զամբյուղ";
    button.type = "button";
    button.addEventListener("click", () => addToCart(product));

    info.append(category, name, description, sizes, price, button);
    card.append(image, info);
    productsBox.appendChild(card);
  });
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(item =>
      item.classList.remove("active")
    );

    button.classList.add("active");
    activeFilter = button.dataset.filter || "all";
    renderProducts();
  });
});

function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  renderCart();
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity,
    0
  );

  cartCount.textContent = count;
  floatingCount.textContent = count;
  cartTotal.textContent = money(total);

  cartItems.innerHTML = "";

  if (!cart.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Զամբյուղը դեռ դատարկ է։";
    cartItems.appendChild(empty);
    return;
  }

  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-item";

    const title = document.createElement("span");
    title.textContent = `${item.name} × ${item.quantity}`;

    const price = document.createElement("strong");
    price.textContent = money(Number(item.price || 0) * item.quantity);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Հեռացնել";
    remove.addEventListener("click", () => {
      cart = cart.filter(product => product.id !== item.id);
      renderCart();
    });

    row.append(title, price, remove);
    cartItems.appendChild(row);
  });
}

const drawer = document.getElementById("cart-drawer");
const scrim = document.getElementById("scrim");

function openCart() {
  drawer.classList.add("open");
  scrim.classList.add("show");
}

function closeCart() {
  drawer.classList.remove("open");
  scrim.classList.remove("show");
}

document.getElementById("open-cart")?.addEventListener("click", openCart);
document.getElementById("close-cart")?.addEventListener("click", closeCart);
scrim?.addEventListener("click", closeCart);

document.getElementById("checkout")?.addEventListener("click", () => {
  if (!cart.length) {
    alert("Ձեր զամբյուղը դատարկ է։");
    return;
  }

  let message = "Բարև։ Ցանկանում եմ պատվիրել՝\n\n";

  cart.forEach(item => {
    message += `${item.name} × ${item.quantity} — ${money(Number(item.price || 0) * item.quantity)}\n`;
  });

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity,
    0
  );

  message += `\nԸնդամենը՝ ${money(total)}`;

  window.open(
    "https://wa.me/37455875005?text=" + encodeURIComponent(message),
    "_blank"
  );
});

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

async function startShop() {
  try {
    await loadSupabase();

    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    await loadProducts();
    renderCart();
  } catch (error) {
    console.error(error);
    showMessage("Կայքի բեռնման ժամանակ խնդիր առաջացավ։");
  }
}

startShop();

