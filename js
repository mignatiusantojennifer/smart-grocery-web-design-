function toggleTheme() {
  document.body.classList.toggle("dark");
}

function ensureCategoryGroup(category) {
  let container = document.getElementById(`cat-${category}`);
  if (!container) {
    container = document.createElement("div");
    container.id = `cat-${category}`;
    container.innerHTML = `<h3>${category}</h3>`;
    document.getElementById("groceryList").appendChild(container);
  }
  return container;
}

function addItem() {
  const name = document.getElementById("itemName").value.trim();
  const qty = document.getElementById("quantity").value;
  const category = document.getElementById("category").value;

 if (!name || qty === "") return alert("Fill all fields!");
if (qty <= 0) return alert("Quantity must be a positive number!");


  const today = new Date();
  const purchase = today.toISOString().split('T')[0];
  const expiry = getExpiryDate(category, today);

  addItemToDOM(name, qty, purchase, expiry, category);
  saveToStorage(name, qty, purchase, expiry, category);

  document.getElementById("itemName").value = "";
  document.getElementById("quantity").value = "";
}

function getExpiryDate(category, baseDate) {
  let daysToAdd = 2;

  if (category === "Dairy") {
    daysToAdd = 2;
  } else if (category === "Snacks") {
    daysToAdd = Math.floor(Math.random() * 2) + 4;
  } else if (category === "Leafy Vegetable") {
    daysToAdd = 3;
  } else if (category === "Fruits" || category === "Vegetables") {
    daysToAdd = 7;
  }

  const exp = new Date(baseDate);
  exp.setDate(exp.getDate() + daysToAdd);
  return exp.toISOString().split('T')[0];
}

function isExpiringSoon(expiry) {
  const today = new Date();
  const expDate = new Date(expiry);
  const diff = (expDate - today) / (1000 * 3600 * 24);
  return diff >= 0 && diff <= 1;
}

function getUsagePattern(itemName) {
  const wasted = JSON.parse(localStorage.getItem("wastedItems")) || [];
  const count = wasted.filter(i => i === itemName).length;
  return count >= 3 ? "reduce" : "normal";
}

function addItemToDOM(name, qty, purchase, expiry, category) {
  const today = new Date();
  const expDate = new Date(expiry);
  const isExpired = expDate < today;
  const isSoon = isExpiringSoon(expiry);
  const usagePattern = getUsagePattern(name.toLowerCase());

  let suggestion = "";
  if (isExpired) {
    suggestion += `<div style="color:red;">⚠️ ${name} is expired.<br>💡 Suggestion: Buy only 1L for 1-day freshness.</div>`;
  } else if (isSoon) {
    suggestion += `<div style="color:orange;">⏰ ${name} is expiring soon. Plan to consume or replace!</div>`;
  }
  if (usagePattern === "reduce") {
    suggestion += `<br>📉 You've wasted this item multiple times. Try buying less next time!`;
  }

  const group = ensureCategoryGroup(category);
  const itemDiv = document.createElement("div");
  itemDiv.className = "item-card" + (isExpired ? " urgent" : "");
  itemDiv.innerHTML = `
    <strong>${name}</strong><br>
    Qty: ${qty}<br>
    Bought: ${purchase}<br>
    Exp: ${expiry}
    ${suggestion}
    <br><button onclick="deleteItem(this, '${name}', '${category}')">🗑 Delete</button>
  `;
  group.appendChild(itemDiv);
}

function deleteItem(button, name, category) {
  const itemDiv = button.parentElement;
  itemDiv.remove();

  let items = JSON.parse(localStorage.getItem("groceryData")) || [];
  const deletedItem = items.find(i => i.name === name);
  if (deletedItem && new Date() > new Date(deletedItem.expiry)) {
    let wasted = JSON.parse(localStorage.getItem("wastedItems")) || [];
    wasted.push(deletedItem.name);
    localStorage.setItem("wastedItems", JSON.stringify(wasted));
  }

  items = items.filter(item => item.name !== name);
  localStorage.setItem("groceryData", JSON.stringify(items));

  const group = document.getElementById(`cat-${category}`);
  if (group && group.querySelectorAll('.item-card').length === 0) {
    group.remove();
  }

  document.getElementById("wasteCount").textContent =
    (JSON.parse(localStorage.getItem("wastedItems")) || []).length;
}

function clearAll() {
  if (confirm("Clear all grocery data and waste history?")) {
    localStorage.removeItem("groceryData");
    localStorage.removeItem("wastedItems");
    document.getElementById("groceryList").innerHTML = "";
    document.getElementById("wasteCount").textContent = "0";
  }
}

function saveToStorage(name, qty, purchase, expiry, category) {
  let items = JSON.parse(localStorage.getItem("groceryData")) || [];
  items.push({ name, qty, purchase, expiry, category });
  localStorage.setItem("groceryData", JSON.stringify(items));
}

window.onload = function () {
  const items = JSON.parse(localStorage.getItem("groceryData")) || [];
  items.forEach(item => {
    addItemToDOM(item.name, item.qty, item.purchase, item.expiry, item.category);
  });

  document.getElementById("wasteCount").textContent =
    (JSON.parse(localStorage.getItem("wastedItems")) || []).length;
};
