const API_URL = "https://script.google.com/macros/s/AKfycbwxH2GAljE5_QGbSQHblOYP7PYQtcLdDHun4aXL0hks4TOXnmLgGzBlgvGQBbsXI6Pa/exec";

const $ = (selector) => document.querySelector(selector);

let jsonpCounter = 0;


/* =========================================================
   TABS
   ========================================================= */

document.querySelectorAll(".tab").forEach((button) => {

  button.addEventListener("click", () => {

    document
      .querySelectorAll(".tab")
      .forEach((b) => b.classList.remove("active"));

    document
      .querySelectorAll(".tab-panel")
      .forEach((p) => p.classList.remove("active"));

    button.classList.add("active");

    const panel = $("#" + button.dataset.tab);

    if (panel) {
      panel.classList.add("active");
    }

  });

});


/* =========================================================
   MENSAJES
   ========================================================= */

function setMessage(element, text, type = "") {

  if (!element) return;

  element.textContent = text;
  element.className = "message " + type;

}


/* =========================================================
   SELECTS
   ========================================================= */

function fillSelect(select, items, placeholder) {

  if (!select) return;

  select.innerHTML = "";

  const defaultOption =
    document.createElement("option");

  defaultOption.value = "";
  defaultOption.textContent = placeholder;

  select.appendChild(defaultOption);


  items.forEach((item) => {

    const option =
      document.createElement("option");

    option.value = item;
    option.textContent = item;

    select.appendChild(option);

  });

}


/* =========================================================
   API GET / JSONP
   ========================================================= */

function apiGet(params) {

  return new Promise((resolve, reject) => {

    const callbackName =
      `gestionDemosCallback_${Date.now()}_${jsonpCounter++}`;

    const script =
      document.createElement("script");


    const query =
      new URLSearchParams({

        ...params,

        callback: callbackName

      });


    let finished = false;


    const timeout =
      setTimeout(() => {

        if (finished) return;

        finished = true;

        cleanup();

        reject(
          new Error(
            "Tiempo de espera agotado al consultar la API."
          )
        );

      }, 30000);


    function cleanup() {

      clearTimeout(timeout);

      delete window[callbackName];

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

    }


    window[callbackName] =
      function(data) {

        if (finished) return;

        finished = true;

        cleanup();

        resolve(data);

      };


    script.onerror =
      function() {

        if (finished) return;

        finished = true;

        cleanup();

        reject(
          new Error(
            "No fue posible conectar con la API."
          )
        );

      };


    script.src =
      `${API_URL}?${query.toString()}`;


    document.body.appendChild(script);

  });

}


/* =========================================================
   CARGAR CATÁLOGOS
   ========================================================= */

async function loadCatalogs() {

  try {

    console.log("Cargando catálogos...");


    const data =
      await apiGet({

        action: "catalogos"

      });


    console.log(
      "Catálogos recibidos:",
      data
    );


    if (
      !data ||
      data.status !== "success"
    ) {

      throw new Error(
        data?.message ||
        "No se pudieron cargar los catálogos."
      );

    }


    fillSelect(
      $("#comercial"),
      data.comerciales || [],
      "Seleccionar comercial"
    );


    fillSelect(
      $("#preventa"),
      data.preventa || [],
      "Seleccionar preventa"
    );


    fillSelect(
      $("#editEstado"),
      data.estados || [],
      "Seleccionar estado"
    );


    console.log(
      "Catálogos cargados correctamente."
    );

  } catch (error) {

    console.error(
      "Error cargando catálogos:",
      error
    );


    fillSelect(
      $("#comercial"),
      [],
      "Error al cargar"
    );


    fillSelect(
      $("#preventa"),
      [],
      "Error al cargar"
    );


    fillSelect(
      $("#editEstado"),
      [],
      "Error al cargar"
    );


    setMessage(
      $("#registroMessage"),
      "No fue posible cargar los catálogos.",
      "error"
    );

  }

}


/* =========================================================
   REGISTRAR PROYECTO
   ========================================================= */

$("#registroForm").addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const button =
      event.submitter;


    button.disabled = true;

    button.textContent =
      "Registrando...";


    const payload = {

      action: "registrar",

      canal:
        $("#canal").value.trim(),

      proyecto:
        $("#proyecto").value.trim(),

      licencias:
        $("#licencias").value,

      comercial:
        $("#comercial").value,

      preventa:
        $("#preventa").value,

      observaciones:
        $("#observaciones").value.trim()

    };


    console.log(
      "Registrando proyecto:",
      payload
    );


    try {

      const data =
        await apiGet(payload);


      console.log(
        "Respuesta del registro:",
        data
      );


      if (
        !data ||
        data.status !== "success"
      ) {

        throw new Error(
          data?.message ||
          "No se pudo registrar el proyecto."
        );

      }


      /* ==========================================
         REGISTRO EXITOSO
         ========================================== */

      setMessage(
        $("#registroMessage"),
        `Proyecto registrado correctamente: ${data.id}`,
        "success"
      );


      /*
       * Limpiar formulario
       */

      $("#registroForm").reset();


      /*
       * Volver a cargar los catálogos
       */

      await loadCatalogs();


    } catch (error) {

      console.error(
        "Error registrando proyecto:",
        error
      );


      setMessage(
        $("#registroMessage"),
        "No se pudo registrar el proyecto. Verifica la conexión con la API.",
        "error"
      );


    } finally {

      button.disabled = false;

      button.textContent =
        "Registrar proyecto";

    }

  }
);


/* =========================================================
   BUSCAR PROYECTOS
   ========================================================= */

$("#buscarForm").addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const query =
      $("#busqueda").value.trim();


    if (!query) {

      setMessage(
        $("#actualizacionMessage"),
        "Escribe algo para buscar.",
        "error"
      );

      return;

    }


    setMessage(
      $("#actualizacionMessage"),
      "Buscando...",
      ""
    );


    $("#resultados").innerHTML = "";

    $("#editor")
      .classList
      .add("hidden");


    try {

      const data =
        await apiGet({

          action: "buscar",

          q: query

        });


      console.log(
        "Resultados búsqueda:",
        data
      );


      if (
        !data ||
        data.status !== "success"
      ) {

        throw new Error(
          data?.message ||
          "No se pudo realizar la búsqueda."
        );

      }


      if (
        !data.demos ||
        !data.demos.length
      ) {

        setMessage(
          $("#actualizacionMessage"),
          "No encontramos proyectos con ese criterio.",
          "error"
        );

        return;

      }


      setMessage(
        $("#actualizacionMessage"),
        `${data.demos.length} proyecto(s) encontrado(s).`,
        "success"
      );


      data.demos.forEach((demo) => {

        const item =
          document.createElement("div");


        item.className =
          "result";


        item.innerHTML = `

          <div class="result-main">

            <div>

              <h3>
                ${escapeHtml(
                  demo.proyecto ||
                  "Sin proyecto"
                )}
              </h3>

              <p>

                ${escapeHtml(
                  demo.id ||
                  ""
                )}

                ·

                ${escapeHtml(
                  demo.canal ||
                  "Sin canal"
                )}

                ·

                ${escapeHtml(
                  demo.preventa ||
                  "Sin preventa"
                )}

              </p>

            </div>


            <span class="badge">

              ${escapeHtml(
                demo.estado ||
                "Sin estado"
              )}

            </span>

          </div>

        `;


        item.addEventListener(
          "click",
          () => openEditor(demo)
        );


        $("#resultados")
          .appendChild(item);

      });


    } catch (error) {

      console.error(
        "Error buscando:",
        error
      );


      setMessage(
        $("#actualizacionMessage"),
        "No fue posible realizar la búsqueda. Verifica la conexión con la API.",
        "error"
      );

    }

  }
);


/* =========================================================
   ABRIR EDITOR
   ========================================================= */

function openEditor(demo) {

  const id =
    demo.id || "";


  const proyecto =
    demo.proyecto || "";


  const estado =
    demo.estado || "";


  const canal =
    demo.canal || "";


  const licencias =
    demo.licencias || "";


  const comercial =
    demo.comercial || "";


  const preventa =
    demo.preventa || "";


  $("#editor")
    .classList
    .remove("hidden");


  $("#editorTitle")
    .textContent =
    proyecto || "Proyecto";


  $("#editorId")
    .textContent =
    id;


  $("#editId")
    .value =
    id;


  $("#editEstado")
    .value =
    estado;


  $("#projectSummary").innerHTML = [

    ["Canal", canal],

    ["Licencias", licencias],

    ["Comercial", comercial],

    ["Preventa", preventa]

  ]
  .map(([label, value]) => `

    <div class="summary-item">

      <span class="summary-label">

        ${escapeHtml(label)}

      </span>


      <span class="summary-value">

        ${escapeHtml(
          value ?? "—"
        )}

      </span>

    </div>

  `)
  .join("");


  $("#editComentario")
    .value = "";


  $("#editor")
    .scrollIntoView({

      behavior: "smooth",

      block: "start"

    });

}


/* =========================================================
   ACTUALIZAR PROYECTO
   ========================================================= */

$("#actualizarForm").addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const button =
      event.submitter;


    button.disabled = true;

    button.textContent =
      "Guardando...";


    const payload = {

      action: "actualizar",

      id:
        $("#editId").value,

      estado:
        $("#editEstado").value,

      comentario:
        $("#editComentario")
          .value
          .trim()

    };


    console.log(
      "Actualizando proyecto:",
      payload
    );


    try {

      const data =
        await apiGet(payload);


      console.log(
        "Respuesta actualización:",
        data
      );


      if (
        !data ||
        data.status !== "success"
      ) {

        throw new Error(
          data?.message ||
          "No se pudo actualizar."
        );

      }


      setMessage(
        $("#actualizacionMessage"),
        `Actualización guardada correctamente en ${data.id}.`,
        "success"
      );


      $("#editComentario")
        .value = "";


      /*
       * Actualizar visualmente el badge
       */

      const selectedDemo =
        data.id;


      document
        .querySelectorAll(".result")
        .forEach((item) => {

          const text =
            item.textContent || "";

          if (
            text.includes(selectedDemo)
          ) {

            const badge =
              item.querySelector(".badge");

            if (badge) {

              badge.textContent =
                $("#editEstado").value;

            }

          }

        });


    } catch (error) {

      console.error(
        "Error actualizando:",
        error
      );


      setMessage(
        $("#actualizacionMessage"),
        "No se pudo guardar la actualización. Verifica la conexión con la API.",
        "error"
      );


    } finally {

      button.disabled = false;

      button.textContent =
        "Guardar actualización";

    }

  }
);


/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =========================================================
   INICIO
   ========================================================= */

loadCatalogs();
