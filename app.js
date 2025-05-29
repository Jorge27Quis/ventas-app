// Variables y referencias a DOM
const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const vendorForm = document.getElementById('vendor-form');
const vendorList = document.getElementById('vendor-list');
const saleForm = document.getElementById('sale-form');
const sellerSelect = document.getElementById('seller-select');
const productSelect = document.getElementById('product-select');
const salesList = document.getElementById('sales-list');
const commissionSummaryBody = document.querySelector('#commission-summary tbody');

// Datos en localStorage
let products = JSON.parse(localStorage.getItem('products')) || [];
let vendors = JSON.parse(localStorage.getItem('vendors')) || [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];

// Guardar en localStorage
function saveProducts() {
  localStorage.setItem('products', JSON.stringify(products));
}
function saveVendors() {
  localStorage.setItem('vendors', JSON.stringify(vendors));
}
function saveSales() {
  localStorage.setItem('sales', JSON.stringify(sales));
}

// Render productos
function renderProducts() {
  productList.innerHTML = '';
  productSelect.innerHTML = '';
  products.forEach((p, i) => {
    const li = document.createElement('li');
    li.textContent = `${p.name} - $${p.price.toFixed(2)} - Stock: ${p.stock}`;
    productList.appendChild(li);

    const option = document.createElement('option');
    option.value = p.name;
    option.textContent = p.name;
    productSelect.appendChild(option);
  });
}

// Render vendedores
function renderVendors() {
  vendorList.innerHTML = '';
  sellerSelect.innerHTML = '';
  vendors.forEach((v, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${v.name} - Comisión: ${(v.rate*100).toFixed(0)}%
      <button onclick="editVendor(${i})">Editar</button>
      <button onclick="deleteVendor(${i})">Eliminar</button>
    `;
    vendorList.appendChild(li);

    const option = document.createElement('option');
    option.value = v.name;
    option.textContent = `${v.name} (${(v.rate*100).toFixed(0)}%)`;
    sellerSelect.appendChild(option);
  });
}

// Render ventas
function renderSales() {
  salesList.innerHTML = '';
  sales.forEach((s, i) => {
    const li = document.createElement('li');
    li.textContent = `[${s.date}] ${s.seller} vendió ${s.quantity} ${s.product} - Comisión: $${s.commission.toFixed(2)}`;
    salesList.appendChild(li);
  });
}

// Agregar producto
productForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('product-name').value.trim();
  const price = parseFloat(document.getElementById('product-price').value);
  const stock = parseInt(document.getElementById('product-stock').value);
  products.push({ name, price, stock });
  saveProducts();
  renderProducts();
  productForm.reset();
});

// Agregar vendedor
vendorForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('vendor-name').value.trim();
  const rate = parseFloat(document.getElementById('vendor-rate').value) / 100;
  if (vendorForm.dataset.editing !== undefined) {
    vendors[vendorForm.dataset.editing] = { name, rate };
    delete vendorForm.dataset.editing;
    vendorForm.querySelector('button').textContent = 'Agregar Vendedor';
  } else {
    vendors.push({ name, rate });
  }
  saveVendors();
  renderVendors();
  vendorForm.reset();
});

// Editar vendedor
window.editVendor = function(index) {
  const v = vendors[index];
  document.getElementById('vendor-name').value = v.name;
  document.getElementById('vendor-rate').value = (v.rate*100).toFixed(0);
  vendorForm.dataset.editing = index;
  vendorForm.querySelector('button').textContent = 'Actualizar';
}

// Eliminar vendedor
window.deleteVendor = function(index) {
  vendors.splice(index,1);
  saveVendors();
  renderVendors();
}

// Registrar venta
saleForm.addEventListener('submit', e => {
  e.preventDefault();
  const seller = sellerSelect.value;
  const product = productSelect.value;
  const quantity = parseInt(document.getElementById('sale-quantity').value);
  if(quantity <= 0) return alert('Cantidad debe ser mayor a 0');
  const productIndex = products.findIndex(p => p.name === product);
  if(productIndex === -1) return alert('Producto no encontrado');
  if(products[productIndex].stock < quantity) return alert('No hay stock suficiente');

  // Calcular comisión
  const vendorData = vendors.find(v => v.name === seller);
  const commissionRate = vendorData ? vendorData.rate : 0.1;

  // Actualizar stock
  products[productIndex].stock -= quantity;
  saveProducts();
  renderProducts();

  const date = new Date().toLocaleString();

  const totalSale = products[productIndex].price * quantity;
  const commission = totalSale * commissionRate;

  sales.push({ seller, product, quantity, date, commission });
  saveSales();
  renderSales();
  renderCommissionSummary();
  saleForm.reset();
});

// Resumen de comisiones por vendedor
function renderCommissionSummary() {
  const summary = {};
  vendors.forEach(v => {
    summary[v.name] = { totalSales: 0, commissionRate: v.rate, totalCommission: 0 };
  });
  sales.forEach(s => {
    if(summary[s.seller]) {
      const productPrice = products.find(p => p.name === s.product)?.price || 0;
      const saleTotal = productPrice * s.quantity;
      summary[s.seller].totalSales += saleTotal;
      summary[s.seller].totalCommission += s.commission;
    }
  });
  commissionSummaryBody.innerHTML = '';
  for(const seller in summary) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${seller}</td>
      <td>$${summary[seller].totalSales.toFixed(2)}</td>
      <td>${(summary[seller].commissionRate*100).toFixed(0)}%</td>
      <td>$${summary[seller].totalCommission.toFixed(2)}</td>
    `;
    commissionSummaryBody.appendChild(tr);
  }
}

// Inicializar renders
renderProducts();
renderVendors();
renderSales();
renderCommissionSummary();

// Registrar service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('Service Worker registrado', reg))
      .catch(err => console.error('Error registrando Service Worker', err));
  });
}