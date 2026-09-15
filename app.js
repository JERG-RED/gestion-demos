const API_URL = "https://script.google.com/macros/s/AKfycbzvoLlk1LSRVL24ClUJBfhpEmlMKajrVFJhFmM_9nYfmw5PA3P0PhHDZikusscyNNsO/exec";

const $ = (selector) => document.querySelector(selector);

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));

    button.classList.add("active");
    $("#" + button.dataset.tab).classList.add("active");
  });
});

function setMessage(element, text, type = "") {
  element.textContent = text;
  element.className = "message " + type;
}

function fillSelect(select, items, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>`;
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  });
}

async function loadCatalogs() {
  try {
    const response = await fetch(API_URL + "?action=catalogos");
    const data = await response.json();

    if (data.status !== "success") {
      throw new Error(data.message || "No se pudieron cargar los catálogos.");
    }

    fillSelect($("#comercial"), data.comerciales || [], "Seleccionar comercial");
    fillSelect($("#preventa"), data.preventa || [], "Seleccionar preventa");
    fillSelect($("#editEstado"), data.estados || [], "Seleccionar estado");
  } catch (error) {
    console.error(error);
    fillSelect($("#comercial"), [], "Error al cargar");
    fillSelect($("#preventa"), [], "Error al cargar");
    fillSelect($("#editEstado"), [], "Error al cargar");
    setMessage($("#registroMessage"), "No fue posible cargar los catálogos. Revisa el acceso de la API.", "error");
  }
}

$("#registroForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = event.submitter;
  button.disabled = true;
  button.textContent = "Registrando...";

  const payload = {
    action: "registrar",
    canal: $("#canal").value.trim(),
    proyecto: $("#proyecto").value.trim(),
    licencias: $("#licencias").value,
    comercial: $("#comercial").value,
    preventa: $("#preventa").value,
    observaciones: $("#observaciones").value.trim()
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.status !== "success") {
      throw new Error(data.message || "No se pudo registrar el proyecto.");
    }

    setMessage($("#registroMessage"), `Proyecto registrado correctamente: ${data.id}`, "success");
    $("#registroForm").reset();
  } catch (error) {
    console.error(error);
    setMessage($("#registroMessage"), "No se pudo registrar el proyecto. Si el error persiste, revisaremos CORS/permisos de Apps Script.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Registrar proyecto";
  }
});

$("#buscarForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = $("#busqueda").value.trim();
  if (!query) {
    setMessage($("#actualizacionMessage"), "Escribe algo para buscar.", "error");
    return;
  }

  setMessage($("#actualizacionMessage"), "Buscando...", "");
  $("#resultados").innerHTML = "";
  $("#editor").classList.add("hidden");

  try {
    const response = await fetch(API_URL + "?action=buscar&q=" + encodeURIComponent(query));
    const data = await response.json();

    if (data.status !== "success") {
      throw new Error(data.message || "No se pudo realizar la búsqueda.");
    }

    if (!data.demos.length) {
      setMessage($("#actualizacionMessage"), "No encontramos proyectos con ese criterio.", "error");
      return;
    }

    setMessage($("#actualizacionMessage"), `${data.demos.length} proyecto(s) encontrado(s).`, "success");

    data.demos.forEach((demo) => {
      const item = document.createElement("div");
      item.className = "result";
      item.innerHTML = `
        <div class="result-main">
          <div>
            <h3>${escapeHtml(demo.proyecto || "Sin proyecto")}</h3>
            <p>${escapeHtml(demo.id)} · ${escapeHtml(demo.canal || "Sin canal")} · ${escapeHtml(demo.preventa || "Sin preventa")}</p>
          </div>
          <span class="badge">${escapeHtml(demo.estado || "Sin estado")}</span>
        </div>
      `;
      item.addEventListener("click", () => openEditor(demo));
      $("#resultados").appendChild(item);
    });
  } catch (error) {
    console.error(error);
    setMessage($("#actualizacionMessage"), "No fue posible realizar la búsqueda. Revisa la URL/permisos de la API.", "error");
  }
});

function openEditor(demo) {
  $("#editor").classList.remove("hidden");
  $("#editorTitle").textContent = demo.proyecto || "Proyecto";
  $("#editorId").textContent = demo.id;
  $("#editId").value = demo.id;
  $("#editEstado").value = demo.estado || "";

  $("#projectSummary").innerHTML = [
    ["Canal", demo.canal],
    ["Licencias", demo.licencias],
    ["Comercial", demo.comercial],
    ["Preventa", demo.preventa]
  ].map(([label, value]) => `
    <div class="summary-item">
      <span class="summary-label">${escapeHtml(label)}</span>
      <span class="summary-value">${escapeHtml(value ?? "—")}</span>
    </div>
  `).join("");

  $("#editComentario").value = "";
  $("#editor").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("#actualizarForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = event.submitter;
  button.disabled = true;
  button.textContent = "Guardando...";

  const payload = {
    action: "actualizar",
    id: $("#editId").value,
    estado: $("#editEstado").value,
    comentario: $("#editComentario").value.trim()
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.status !== "success") {
      throw new Error(data.message || "No se pudo actualizar.");
    }

    setMessage($("#actualizacionMessage"), `Actualización guardada correctamente en ${data.id}.`, "success");
    $("#editComentario").value = "";
  } catch (error) {
    console.error(error);
    setMessage($("#actualizacionMessage"), "No se pudo guardar la actualización. Si el error persiste, revisaremos CORS/permisos de Apps Script.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Guardar actualización";
  }
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadCatalogs();
