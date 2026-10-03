/* MenuDirect simple demo — uses existing /api/* and Socket.io. No backend changes. */

const ACCOUNTS = {
  manager: { email: 'manager@menudirect.com', password: 'password123' },
  staff: { email: 'staff@menudirect.com', password: 'password123' },
  kitchen: { email: 'chef@menudirect.com', password: 'password123' },
  customer: { email: 'customer@menudirect.com', password: 'password123' }
};

const state = {
  token: localStorage.getItem('md_token') || '',
  user: JSON.parse(localStorage.getItem('md_user') || 'null'),
  tableNumber: null,
  tableId: null,
  menus: [],
  cart: {}, // menuItemId -> qty
  lastOrderId: localStorage.getItem('md_last_order') || '',
  lastOrderNumber: localStorage.getItem('md_last_order_num') || ''
};

const $ = (id) => document.getElementById(id);

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2800);
}

function logFeed(tag, msg) {
  const feed = $('eventFeed');
  if (!feed) return;
  const time = new Date().toLocaleTimeString();
  const row = document.createElement('div');
  row.textContent = `[${time}] ${tag}: ${msg}`;
  feed.prepend(row);
}

function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (state.token) h.Authorization = `Bearer ${state.token}`;
  return h;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function saveAuth() {
  if (state.token) localStorage.setItem('md_token', state.token);
  else localStorage.removeItem('md_token');
  if (state.user) localStorage.setItem('md_user', JSON.stringify(state.user));
  else localStorage.removeItem('md_user');
  updateAuthUI();
}

function updateAuthUI() {
  const pill = $('userPill');
  if (state.user && state.token) {
    pill.textContent = `${state.user.name} (${state.user.role})`;
  } else {
    pill.textContent = 'Not logged in';
  }
  const label = state.user
    ? `Logged in as ${state.user.email} · role: ${state.user.role}`
    : 'Not logged in yet';
  ['kitchenAuthStatus', 'staffAuthStatus', 'managerAuthStatus'].forEach((id) => {
    const el = $(id);
    if (el) el.textContent = ' — ' + label;
  });
  if (state.lastOrderId) {
    $('lastOrderInfo').textContent = `Last order: ${state.lastOrderNumber || state.lastOrderId}`;
    if (!$('notifOrderId').value) $('notifOrderId').placeholder = state.lastOrderId;
  }
}

async function loginAs(roleKey) {
  const creds = ACCOUNTS[roleKey];
  if (!creds) return;
  try {
    const json = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(creds)
    });
    state.token = json.data.token;
    state.user = {
      _id: json.data._id,
      name: json.data.name,
      email: json.data.email,
      role: json.data.role
    };
    saveAuth();
    toast(`Logged in as ${state.user.role}`);
    if (roleKey === 'kitchen' || roleKey === 'staff') loadKitchen();
    if (roleKey === 'staff' || roleKey === 'manager') {
      loadStaffTables();
      loadInventory();
      fillCustMenuSelect();
    }
  } catch (e) {
    toast(e.message);
  }
}

/* ---------- Tabs ---------- */
document.querySelectorAll('#tabs button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    $(`panel-${btn.dataset.tab}`).classList.add('active');
  });
});

document.querySelectorAll('[data-login]').forEach((btn) => {
  btn.addEventListener('click', () => loginAs(btn.dataset.login));
});

/* ---------- Socket.io ---------- */
const socket = io();
socket.on('connect', () => {
  $('socketPill').textContent = 'Socket: connected';
  $('socketPill').className = 'pill live';
  logFeed('SOCKET', `Connected ${socket.id}`);
  socket.emit('join_kitchen');
  if (state.tableNumber) socket.emit('join_table', state.tableNumber);
});
socket.on('disconnect', () => {
  $('socketPill').textContent = 'Socket: offline';
  $('socketPill').className = 'pill off';
});
socket.on('joined_room_confirmation', (d) => logFeed('ROOM', d.message));
socket.on('new_order_received', (order) => {
  logFeed('NEW ORDER', `#${order.orderNumber} Table ${order.tableNumber} ₹${order.totalAmount}`);
  loadKitchen();
});
socket.on('order_status_updated', (d) => {
  logFeed('STATUS', `#${d.orderNumber} → ${d.status}`);
  loadKitchen();
});
socket.on('kitchen_order_updated', (order) => {
  logFeed('KITCHEN', `Order updated #${order.orderNumber || order._id}`);
  loadKitchen();
});
socket.on('order_created', (order) => {
  logFeed('TABLE', `Your table got order #${order.orderNumber}`);
});

/* ---------- Customer: tables + menu + cart ---------- */
async function loadTables() {
  try {
    const json = await api('/api/tables');
    renderTableChips(json.data, state.tableNumber);
    if (!state.tableNumber && json.data[0]) selectTable(json.data[0]);
  } catch (e) {
    toast(e.message);
  }
}

function renderTableChips(tables, activeNumber) {
  const grid = $('tablesGrid');
  grid.innerHTML = '';
  tables.forEach((t) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'table-chip' + (activeNumber === t.tableNumber ? ' active' : '');
    el.innerHTML = `<strong>Table ${t.tableNumber}</strong><small>${t.status} · seats ${t.capacity}</small>`;
    el.onclick = () => selectTable(t);
    grid.appendChild(el);
  });
}

async function selectTable(table) {
  state.tableNumber = table.tableNumber;
  state.tableId = table._id;
  document.querySelectorAll('.table-chip').forEach((c) => {
    c.classList.toggle('active', c.textContent.includes(`Table ${table.tableNumber}`));
  });
  socket.emit('join_table', table.tableNumber);
  try {
    const json = await api(`/api/qr/table/${table.tableNumber}`);
    const payload = json.data || {};
    const qr =
      payload.qrCodeUrl ||
      (payload.table && payload.table.qrCodeUrl) ||
      table.qrCodeUrl ||
      '';
    $('qrImg').src = qr;
    $('qrLabel').textContent = `Table #${table.tableNumber}`;
  } catch {
    $('qrImg').src = table.qrCodeUrl || '';
    $('qrLabel').textContent = `Table #${table.tableNumber}`;
  }
}

async function loadMenus() {
  const json = await api('/api/menus');
  state.menus = json.data || [];
  renderMenu();
  fillCustMenuSelect();
}

function renderMenu() {
  const list = $('menuList');
  list.innerHTML = '';
  if (!state.menus.length) {
    list.innerHTML = '<p class="empty">No menu items. Run npm run seed or add items as staff.</p>';
    return;
  }
  state.menus.forEach((item) => {
    const qty = state.cart[item._id] || 0;
    const row = document.createElement('div');
    row.className = 'menu-item';
    row.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <div class="meta">${item.category} · ₹${item.price}${item.isAvailable === false ? ' · UNAVAILABLE' : ''}</div>
      </div>
      <div class="qty">
        <button type="button" data-act="dec" data-id="${item._id}">−</button>
        <span>${qty}</span>
        <button type="button" data-act="inc" data-id="${item._id}">+</button>
      </div>`;
    row.querySelectorAll('button').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.id;
        const cur = state.cart[id] || 0;
        if (b.dataset.act === 'inc') state.cart[id] = cur + 1;
        else if (cur > 0) {
          state.cart[id] = cur - 1;
          if (state.cart[id] === 0) delete state.cart[id];
        }
        renderMenu();
        renderCart();
      };
    });
    list.appendChild(row);
  });
}

function renderCart() {
  const box = $('cartList');
  box.innerHTML = '';
  let count = 0;
  Object.entries(state.cart).forEach(([id, qty]) => {
    const item = state.menus.find((m) => m._id === id);
    if (!item || !qty) return;
    count += qty;
    const line = document.createElement('div');
    line.className = 'cart-line';
    line.innerHTML = `<span>${qty}× ${item.name}</span><span>₹${item.price * qty}</span>`;
    box.appendChild(line);
  });
  $('cartTotal').textContent = count ? `Items in cart: ${count}` : 'Cart is empty';
}

$('btnClearCart').onclick = () => {
  state.cart = {};
  renderMenu();
  renderCart();
};

$('btnPlaceOrder').onclick = async () => {
  const items = Object.entries(state.cart)
    .filter(([, q]) => q > 0)
    .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
  if (!items.length) return toast('Add at least one item');
  if (!state.tableNumber) return toast('Select a table first');
  try {
    const json = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        tableNumber: state.tableNumber,
        customerName: $('customerName').value || 'Guest',
        items
      })
    });
    state.lastOrderId = json.data._id;
    state.lastOrderNumber = json.data.orderNumber;
    localStorage.setItem('md_last_order', state.lastOrderId);
    localStorage.setItem('md_last_order_num', state.lastOrderNumber);
    state.cart = {};
    renderMenu();
    renderCart();
    updateAuthUI();
    toast(`Order ${json.data.orderNumber} placed · ₹${json.data.totalAmount}`);
    $('lastOrderInfo').textContent =
      `Order ${json.data.orderNumber} · total ₹${json.data.totalAmount} (tax included) · id ${json.data._id}`;
  } catch (e) {
    toast(e.message);
  }
};

$('btnSplitBill').onclick = async () => {
  if (!state.lastOrderId) return toast('Place an order first');
  try {
    const json = await api('/api/split-bill', {
      method: 'POST',
      body: JSON.stringify({
        orderId: state.lastOrderId,
        splitType: 'equal',
        numberOfPeople: Number($('splitPeople').value) || 2
      })
    });
    const shares = (json.data.shares || []).map((s, i) => `Person ${i + 1}: ₹${s.amount}`).join('\n');
    $('splitResult').textContent = `Split OK\n${shares}`;
    toast('Bill split created');
  } catch (e) {
    $('splitResult').textContent = e.message;
    toast(e.message);
  }
};

/* ---------- Kitchen ---------- */
async function loadKitchen() {
  const list = $('kitchenList');
  if (!state.token) {
    list.innerHTML = '<p class="empty">Login as kitchen or staff to load tickets.</p>';
    return;
  }
  try {
    let json;
    try {
      json = await api('/api/kitchen');
    } catch {
      json = await api('/api/orders');
    }
    const rows = json.data || [];
    if (!rows.length) {
      list.innerHTML = '<p class="empty">No active tickets. Place a customer order first.</p>';
      return;
    }
    list.innerHTML = '';
    rows.slice(0, 20).forEach((row) => {
      const isTicket = !!row.items && row.order;
      const orderId = isTicket ? (row.order._id || row.order) : row._id;
      const orderNumber = isTicket
        ? (row.order.orderNumber || row.ticketNumber || '')
        : row.orderNumber;
      const tableNumber = isTicket
        ? (row.tableNumber || row.order.tableNumber)
        : row.tableNumber;
      const status = row.status;
      const items = (row.items || [])
        .map((i) => `${i.quantity}× ${i.name || i.itemName || ''}`)
        .join(', ');
      const card = document.createElement('div');
      card.className = 'ticket';
      card.innerHTML = `
        <div class="row" style="justify-content:space-between">
          <strong>${orderNumber || 'Ticket'} · Table ${tableNumber || '?'}</strong>
          <span class="status ${status}">${status}</span>
        </div>
        <div class="meta" style="margin:6px 0;color:var(--muted);font-size:0.85rem">${items || '—'}</div>
        <div class="row">
          <button class="btn sm secondary" data-s="preparing">Cooking</button>
          <button class="btn sm teal" data-s="ready">Ready</button>
          <button class="btn sm ok" data-s="served">Served</button>
          <button class="btn sm" data-s="paid">Paid</button>
        </div>`;
      card.querySelectorAll('button[data-s]').forEach((b) => {
        b.onclick = async () => {
          try {
            if (isTicket) {
              const map = {
                preparing: 'in_progress',
                ready: 'ready_for_pickup',
                served: 'served',
                paid: 'served'
              };
              await api(`/api/kitchen/${row._id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: map[b.dataset.s] || b.dataset.s })
              });
              if (b.dataset.s === 'paid' && orderId) {
                await api(`/api/orders/${orderId}/status`, {
                  method: 'PUT',
                  body: JSON.stringify({ status: 'paid' })
                });
              }
            } else {
              await api(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: b.dataset.s })
              });
            }
            toast(`Updated to ${b.dataset.s}`);
            loadKitchen();
          } catch (e) {
            toast(e.message);
          }
        };
      });
      list.appendChild(card);
    });
  } catch (e) {
    list.innerHTML = `<p class="empty">${e.message}</p>`;
  }
}

$('btnRefreshKitchen').onclick = loadKitchen;

/* ---------- Staff ---------- */
function fillCustMenuSelect() {
  const sel = $('custMenuSelect');
  if (!sel) return;
  sel.innerHTML = state.menus
    .map((m) => `<option value="${m._id}">${m.name}</option>`)
    .join('');
}

$('btnCreateMenu').onclick = async () => {
  try {
    await api('/api/menus', {
      method: 'POST',
      body: JSON.stringify({
        name: $('newMenuName').value,
        description: $('newMenuDesc').value,
        price: Number($('newMenuPrice').value),
        category: $('newMenuCat').value,
        preparationTimeMinutes: 15
      })
    });
    toast('Menu item created');
    $('newMenuName').value = '';
    await loadMenus();
  } catch (e) {
    toast(e.message);
  }
};

$('btnAddCust').onclick = async () => {
  try {
    await api('/api/customizations', {
      method: 'POST',
      body: JSON.stringify({
        menuItemId: $('custMenuSelect').value,
        name: $('custName').value,
        additionalPrice: Number($('custPrice').value) || 0
      })
    });
    toast('Customization added');
    await loadMenus();
  } catch (e) {
    toast(e.message);
  }
};

$('btnCreateTable').onclick = async () => {
  try {
    await api('/api/tables', {
      method: 'POST',
      body: JSON.stringify({
        tableNumber: Number($('newTableNum').value),
        capacity: Number($('newTableCap').value) || 4
      })
    });
    toast('Table created');
    loadTables();
    loadStaffTables();
  } catch (e) {
    toast(e.message);
  }
};

async function loadStaffTables() {
  const box = $('staffTables');
  try {
    const json = await api('/api/tables');
    box.innerHTML = json.data
      .map(
        (t) =>
          `<div class="list-row"><strong>Table ${t.tableNumber}</strong> · ${t.status} · capacity ${t.capacity}</div>`
      )
      .join('');
  } catch (e) {
    box.innerHTML = `<p class="empty">${e.message}</p>`;
  }
}

async function loadInventory() {
  const box = $('invList');
  if (!state.token) {
    box.innerHTML = '<p class="empty">Login required</p>';
    return;
  }
  try {
    const json = await api('/api/inventory');
    box.innerHTML = '';
    (json.data || []).forEach((item) => {
      const row = document.createElement('div');
      row.className = 'list-row';
      row.innerHTML = `
        <div class="row" style="justify-content:space-between">
          <span><strong>${item.itemName}</strong> · ${item.currentStock} ${item.unit || ''}
            <span class="status">${item.status || ''}</span></span>
          <button class="btn sm ghost" type="button">+10</button>
        </div>`;
      row.querySelector('button').onclick = async () => {
        try {
          await api(`/api/inventory/${item._id}`, {
            method: 'PUT',
            body: JSON.stringify({ restockQuantity: 10 })
          });
          toast('Restocked +10');
          loadInventory();
        } catch (e) {
          toast(e.message);
        }
      };
      box.appendChild(row);
    });
  } catch (e) {
    box.innerHTML = `<p class="empty">${e.message}</p>`;
  }
}

$('btnRefreshInv').onclick = loadInventory;

/* ---------- Manager ---------- */
$('btnPopular').onclick = async () => {
  try {
    const json = await api('/api/analytics/popular');
    const rows = json.data || json.popular || [];
    $('popularList').innerHTML = rows.length
      ? rows
          .map(
            (r, i) =>
              `<div class="list-row">${i + 1}. <strong>${r.name || r._id}</strong> · ordered ${r.ordersCount || r.count || 0}×</div>`
          )
          .join('')
      : '<p class="empty">No data yet</p>';
  } catch (e) {
    $('popularList').innerHTML = `<p class="empty">${e.message}</p>`;
  }
};

$('btnPeak').onclick = async () => {
  try {
    const json = await api('/api/analytics/peak-hours');
    const rows = (json.data || [])
      .filter((r) => (r.ordersCount || 0) > 0)
      .sort((a, b) => b.ordersCount - a.ordersCount);
    $('peakList').innerHTML = rows.length
      ? `<p class="hint">${json.peakHour || ''}</p>` +
        rows
          .map(
            (r) =>
              `<div class="list-row"><strong>${String(r.hour).padStart(2, '0')}:00</strong> · ${r.ordersCount} orders · ₹${r.totalRevenue || 0}</div>`
          )
          .join('')
      : '<p class="empty">No orders recorded yet</p>';
  } catch (e) {
    $('peakList').innerHTML = `<p class="empty">${e.message}</p>`;
  }
};

$('btnNotif').onclick = async () => {
  const orderId = $('notifOrderId').value.trim() || state.lastOrderId;
  if (!orderId) return toast('Need an order id');
  try {
    const json = await api('/api/notifications/send', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        title: $('notifTitle').value,
        message: $('notifMsg').value
      })
    });
    $('notifResult').textContent = JSON.stringify(json, null, 2);
    toast('Notification dispatched (simulated FCM)');
  } catch (e) {
    $('notifResult').textContent = e.message;
    toast(e.message);
  }
};

/* ---------- Boot ---------- */
updateAuthUI();
loadTables();
loadMenus();
renderCart();
if (state.token) {
  loadKitchen();
  loadStaffTables();
  loadInventory();
}
