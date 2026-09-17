const API = '/api';
let usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
let filtroActual = 'hoy';

// ---------- utilidades ----------
const $ = id => document.getElementById(id);
const fmt = n => '$' + Number(n).toLocaleString('es-CO');
function mostrarMsg(el, texto, ok = false) {
  el.textContent = texto;
  el.className = 'msg ' + (ok ? 'ok' : 'error');
}
async function api(ruta, opciones = {}) {
  const res = await fetch(API + ruta, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) }
    // la cookie de sesión se envía automáticamente (mismo origen)
  });
  if (res.status === 401 && ruta !== '/auth/login') {
    usuario = null;
    localStorage.removeItem('usuario');
    $('vista-app').style.display = 'none';
    $('vista-login').style.display = 'flex';
    mostrarMsg($('login-msg'), 'Tu sesión ha expirado o el usuario ya no existe. Inicia sesión de nuevo.');
    throw new Error('Sesión expirada');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.mensaje || 'Error del servidor');
  return data;
}

// Fechas en hora local (evita problemas de zona horaria con UTC)
function inicioDia(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }
function finDia(d){ const x = new Date(d); x.setHours(23,59,59,999); return x; }
function hoyISO(){ return new Date().toISOString().slice(0,10); }

const TITULOS = { hoy:'Compras de hoy', ayer:'Compras de ayer', semana:'Compras de la última semana',
                  mes:'Compras del último mes', todas:'Todas mis compras', custom:'Compras del periodo seleccionado' };

function rangoFiltro(filtro) {
  const hoy = new Date();
  switch (filtro) {
    case 'hoy':    return { desde: inicioDia(hoy), hasta: finDia(hoy) };
    case 'ayer': { const a = new Date(); a.setDate(a.getDate() - 1);
                   return { desde: inicioDia(a), hasta: finDia(a) }; }
    case 'semana': { const d = new Date(); d.setDate(d.getDate() - 6);
                   return { desde: inicioDia(d), hasta: finDia(hoy) }; }
    case 'mes':  { const d = new Date(); d.setDate(d.getDate() - 29);
                   return { desde: inicioDia(d), hasta: finDia(hoy) }; }
    default:     return {}; // todas
  }
}

// Pinta la tabla y las tarjetas de resumen con el conjunto recibido
function pintarCompras(compras) {
  const tbody = $('c-tabla').querySelector('tbody');
  tbody.innerHTML = '';
  let items = 0, gasto = 0;
  compras.forEach(c => {
    items += c.cantidad;
    gasto += c.cantidad * c.valor;
    tbody.insertAdjacentHTML('beforeend', `<tr>
      <td data-label="Fecha">${new Date(c.fecha).toLocaleString('es-CO')}</td>
      <td data-label="Producto">${c.item}</td>
      <td data-label="Cantidad">${c.cantidad}</td>
      <td data-label="Valor unitario">${fmt(c.valor)}</td>
      <td data-label="Total" class="total-row">${fmt(c.cantidad * c.valor)}</td>
    </tr>`);
  });
  $('c-total-compras').textContent = compras.length;
  $('c-total-items').textContent = items;
  $('c-total-gasto').textContent = fmt(gasto);
  $('c-vacio').style.display = compras.length ? 'none' : 'block';
}

// ---------- login / sesión ----------
$('form-login').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true; btn.textContent = 'Ingresando...';
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: $('login-email').value, password: $('login-pass').value })
    });
    usuario = data.usuario; // el token va en cookie httpOnly, NO se guarda aquí
    localStorage.setItem('usuario', JSON.stringify(usuario));
    iniciarApp();
  } catch (err) {
    mostrarMsg($('login-msg'), err.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Iniciar sesión';
  }
});

async function salir() {
  try { await fetch(API + '/auth/logout', { method: 'POST' }); } catch (e) { /* ignorar */ }
  localStorage.removeItem('usuario');
  location.reload();
}

// --- Controlador para el botón de cerrar sesión ---
const btnSalir = $('btn-salir');
if (btnSalir) {
  btnSalir.addEventListener('click', salir);
}

// ---------- navegación por pestañas ----------
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('activo'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('activo'));
    tab.classList.add('activo');
    $(tab.dataset.tab).classList.add('activo');
    if (tab.dataset.tab === 'c-nueva') $('compra-fecha').value = new Date().toLocaleString('es-CO');
  });
});

// ---------- inicio ----------
function iniciarApp() {
  $('vista-login').style.display = 'none';
  $('vista-app').style.display = 'block';
  $('barra-nombre').textContent = usuario.nombre;
  $('barra-rol').textContent = usuario.rol === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE';

  $('f-desde').value = hoyISO();
  $('f-hasta').value = hoyISO();

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('activo'));
  document.querySelectorAll('.panel').forEach(pl => pl.classList.remove('activo'));

  const tabsId = usuario.rol === 'admin' ? 'tabs-admin' : 'tabs-cliente';
  const primerPanel = usuario.rol === 'admin' ? 'a-inicio' : 'c-inicio';
  $(tabsId).style.display = 'flex';
  $(tabsId).querySelector('.tab').classList.add('activo');
  $(primerPanel).classList.add('activo');

  if (usuario.rol === 'admin') cargarAdmin();
  else cargarCliente('hoy');
}

// ---------- CLIENTE ----------
async function cargarCliente(filtro = filtroActual) {
  filtroActual = filtro;
  document.querySelectorAll('.chip').forEach(c =>
    c.classList.toggle('activo', c.dataset.filtro === filtro));
  $('c-titulo-tabla').textContent = TITULOS[filtro] || 'Mis compras';

  try {
    const params = new URLSearchParams();
    const r = rangoFiltro(filtro);
    if (r.desde) params.set('desde', r.desde.toISOString());
    if (r.hasta) params.set('hasta', r.hasta.toISOString());
    const qs = params.toString();
    pintarCompras(await api('/purchases/mine' + (qs ? '?' + qs : '')));
  } catch (err) { console.error(err); }
}

async function filtrarPorFechas() {
  const d = $('f-desde').value, h = $('f-hasta').value;
  if (!d || !h) return alert('Selecciona ambas fechas.');
  if (d > h) return alert('La fecha "Desde" no puede ser mayor que "Hasta".');
  filtroActual = 'custom';
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('activo'));
  $('c-titulo-tabla').textContent = TITULOS.custom;

  try {
    const params = new URLSearchParams({
      desde: inicioDia(new Date(d + 'T00:00')).toISOString(),
      hasta: finDia(new Date(h + 'T00:00')).toISOString()
    });
    pintarCompras(await api('/purchases/mine?' + params.toString()));
  } catch (err) { console.error(err); }
}

$('form-compra').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await api('/purchases', {
      method: 'POST',
      body: JSON.stringify({
        item: $('compra-item').value,
        cantidad: $('compra-cantidad').value,
        valor: $('compra-valor').value
      })
    });
    mostrarMsg($('compra-msg'), '✅ Compra registrada correctamente.', true);
    e.target.reset(); $('compra-cantidad').value = 1;
    $('compra-fecha').value = new Date().toLocaleString('es-CO');
    cargarCliente('hoy');
  } catch (err) { mostrarMsg($('compra-msg'), err.message); }
});

// ---------- ADMIN ----------
async function cargarAdmin() {
  await cargarUsuariosAdmin();
}
async function cargarUsuariosAdmin() {
  try {
    const usuarios = await api('/admin/users');
    const tbody = $('a-tabla-usuarios').querySelector('tbody');
    tbody.innerHTML = '';
    const select = $('export-cliente');
    select.innerHTML = '';
    usuarios.forEach(u => {
      tbody.insertAdjacentHTML('beforeend', `<tr>
        <td data-label="Nombre">${u.nombre}</td><td data-label="Email">${u.email}</td>
        <td data-label="Registrado">${new Date(u.createdAt).toLocaleDateString('es-CO')}</td></tr>`);
      select.insertAdjacentHTML('beforeend', `<option value="${u._id}">${u.nombre} (${u.email})</option>`);
    });
    $('a-total-clientes').textContent = usuarios.length;
    $('a-vacio-usuarios').style.display = usuarios.length ? 'none' : 'block';
  } catch (err) { console.error(err); }
}

$('form-usuario').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await api('/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        nombre: $('u-nombre').value,
        email: $('u-email').value,
        password: $('u-pass').value,
        rol: $('u-rol').value
      })
    });
    mostrarMsg($('usuario-msg'), '✅ Usuario creado correctamente.', true);
    e.target.reset();
    cargarUsuariosAdmin();
  } catch (err) { mostrarMsg($('usuario-msg'), err.message); }
});

async function exportarCSV() {
  const id = $('export-cliente').value;
  if (!id) return alert('Selecciona un cliente.');
  const res = await fetch(API + '/admin/export/' + id);
  if (!res.ok) return alert('Error al exportar.');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'compras_cliente.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

// sesión activa -> entrar directo (si la cookie expiró, la primera llamada API mostrará el login)
if (usuario) iniciarApp();
