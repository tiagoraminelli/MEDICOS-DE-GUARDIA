const ENDPOINT = "https://script.google.com/macros/s/AKfycbw3501xoGSreL-VGMyOv0TffLfBVqiRJhnUSE_mN3zRuYdnPTTVuFALWoWgt3yCLrhh/exec";

let datosGlobales = [];

// --- 1. LEER DATOS (Usando JSONP para evitar CORS) ---
function cargarDatos() {
  const $estado = document.getElementById("estado");
  $estado.textContent = "Cargando datos...";
  document.getElementById("cuerpoTabla").innerHTML = "";
  
  const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
  
  window[callbackName] = function(data) {
    datosGlobales = data;
    renderizarTabla(data);
    $estado.textContent = `${data.length} médico(s) registrados`;
    document.body.removeChild(script);
    delete window[callbackName];
  };

  const script = document.createElement('script');
  script.src = ENDPOINT + '?callback=' + callbackName;
  document.body.appendChild(script);
}

// --- 2. RENDERIZAR TABLA (Con clases de Tailwind) ---
function renderizarTabla(medicos) {
  const thead = document.getElementById("cabecera");
  const tbody = document.getElementById("cuerpoTabla");
  
  if (medicos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-500 text-sm">No hay médicos registrados.</td></tr>`;
    return;
  }

  thead.innerHTML = `
    <th class="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
    <th class="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Especialidad</th>
    <th class="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Matrícula</th>
    <th class="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Contacto</th>
    <th class="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
    <th class="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Acciones</th>
  `;

  tbody.innerHTML = medicos.map((m, index) => {
    const filaReal = index + 2; 
    const isActivo = m.estado === 'Activo';
    const badgeClass = isActivo ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200";
    
    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-4 py-3 text-sm font-medium text-brand"><strong>${m.nombre || ''} ${m.apellido || ''}</strong></td>
        <td class="px-4 py-3 text-sm text-gray-600">${m.especialidad || '-'}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${m.matricula || '-'}</td>
        <td class="px-4 py-3 text-sm text-gray-500 flex flex-col gap-0.5">
          <span>${m.telefono || 'Sin teléfono'}</span>
          <span class="text-xs">${m.email || ''}</span>
        </td>
        <td class="px-4 py-3 text-sm">
          <span class="px-2 py-1 rounded text-[11px] font-semibold uppercase ${badgeClass}">
            ${m.estado || 'N/A'}
          </span>
        </td>
        <td class="px-4 py-3 text-sm text-center">
          <div class="flex items-center justify-center gap-2">
            <button class="px-2 py-1 text-xs font-medium border border-border rounded text-gray-700 hover:bg-gray-100 hover:text-black transition-colors" onclick="abrirModalEditar(${filaReal})">Editar</button>
            <button class="px-2 py-1 text-xs font-medium border border-red-200 rounded text-red-600 hover:bg-red-50 transition-colors" onclick="eliminarMedico(${filaReal})">Borrar</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// --- 3. BUSCADOR ---
document.getElementById("inputBuscador").addEventListener("input", (e) => {
  const termino = e.target.value.toLowerCase();
  const filtrados = datosGlobales.filter(m => 
    Object.values(m).some(val => String(val).toLowerCase().includes(termino))
  );
  renderizarTabla(filtrados);
});

// --- 4. MODAL (Usando clases de Tailwind) ---
const modal = document.getElementById("modalOverlay");
const modalContent = document.getElementById("modalContent");
const form = document.getElementById("formMedico");

function abrirModal() {
  modal.classList.remove("opacity-0", "pointer-events-none");
  modalContent.classList.remove("translate-y-4");
}

function cerrarModal() {
  modal.classList.add("opacity-0", "pointer-events-none");
  modalContent.classList.add("translate-y-4");
}

document.getElementById("btnNuevo").onclick = () => {
  form.reset();
  document.getElementById("medicoFila").value = "";
  document.getElementById("modalTitulo").textContent = "Nuevo Médico";
  abrirModal();
};

document.getElementById("btnCerrarModal").onclick = cerrarModal;
document.getElementById("btnCancelar").onclick = cerrarModal;
modal.onclick = (e) => { if (e.target === modal) cerrarModal(); };

window.abrirModalEditar = function(fila) {
  const m = datosGlobales[fila - 2];
  if(!m) return;
  
  document.getElementById("medicoFila").value = fila;
  document.getElementById("nombre").value = m.nombre || "";
  document.getElementById("apellido").value = m.apellido || "";
  document.getElementById("matricula").value = m.matricula || "";
  document.getElementById("especialidad").value = m.especialidad || "";
  document.getElementById("telefono").value = m.telefono || "";
  document.getElementById("email").value = m.email || "";
  document.getElementById("horario").value = m.horario || "";
  document.getElementById("estado").value = m.estado || "Activo";
  document.getElementById("modalTitulo").textContent = "Editar Médico";
  
  abrirModal();
};

// --- 5. GUARDAR (Formulario Oculto) ---
form.onsubmit = function(e) {
  e.preventDefault();
  const btn = document.getElementById("btnGuardar");
  btn.textContent = "Guardando...";
  btn.disabled = true;

  const fila = document.getElementById("medicoFila").value;
  
  const iframeName = "hidden_iframe_" + Date.now();
  const iframe = document.createElement("iframe");
  iframe.name = iframeName;
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const hiddenForm = document.createElement("form");
  hiddenForm.method = "POST";
  hiddenForm.action = ENDPOINT;
  hiddenForm.target = iframeName;
  hiddenForm.style.display = "none";

  const addInput = (name, value) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value !== undefined && value !== null ? value : "";
    hiddenForm.appendChild(input);
  };

  addInput("accion", fila ? "editar" : "agregar");
  if (fila) addInput("fila", fila);
  
  addInput("nombre", document.getElementById("nombre").value);
  addInput("apellido", document.getElementById("apellido").value);
  addInput("matricula", document.getElementById("matricula").value);
  addInput("especialidad", document.getElementById("especialidad").value);
  addInput("telefono", document.getElementById("telefono").value);
  addInput("email", document.getElementById("email").value);
  addInput("horario", document.getElementById("horario").value);
  addInput("estado", document.getElementById("estado").value);

  document.body.appendChild(hiddenForm);
  hiddenForm.submit();

  setTimeout(() => {
    document.body.removeChild(hiddenForm);
    document.body.removeChild(iframe);
    cerrarModal(); // 👈 Usa la nueva función de Tailwind
    btn.textContent = "Guardar";
    btn.disabled = false;
    cargarDatos(); 
  }, 1500); 
};

// --- 6. ELIMINAR ---
window.eliminarMedico = function(fila) {
  if (!confirm("¿Eliminar este médico?")) return;

  const iframeName = "hidden_iframe_del_" + Date.now();
  const iframe = document.createElement("iframe");
  iframe.name = iframeName;
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const hiddenForm = document.createElement("form");
  hiddenForm.method = "POST";
  hiddenForm.action = ENDPOINT;
  hiddenForm.target = iframeName;
  hiddenForm.style.display = "none";

  const addInput = (name, value) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    hiddenForm.appendChild(input);
  };

  addInput("accion", "eliminar");
  addInput("fila", fila);

  document.body.appendChild(hiddenForm);
  hiddenForm.submit();

  setTimeout(() => {
    document.body.removeChild(hiddenForm);
    document.body.removeChild(iframe);
    cargarDatos();
  }, 1500);
};

// Iniciar
cargarDatos();