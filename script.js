setTimeout(() => window.scrollTo(0, 0), 0);


const pickerInicio = new Pikaday({
  field: document.getElementById('fecha_inicio'),
  firstDay: 1,
  minDate: new Date(),
 disableDayFn: date => date.getDay() === 0

  i18n: {
    previousMonth : 'Mes anterior',
    nextMonth     : 'Mes siguiente',
    months        : ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
    weekdays      : ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
    weekdaysShort : ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  },
  format: 'YYYY-MM-DD',
  onSelect: function(date) {
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    document.getElementById('fecha_inicio').value = formattedDate;
  }
});

// Cargar clientes desde Power Automate
async function cargarClientes() {
  console.log("Cargando clientes...");
  const paisSeleccionado = document.getElementById("pais").value;

  try {
    const response = await fetch('https://prod-180.westus.logic.azure.com:443/workflows/52f2f35e391e44a8908c520abe125e35/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=w2W7uCu_LhVhWPZwbkcKYqHVVYb61nH_ih8o2L-ZoQ0');
    const data = await response.json();

    const clientes = data.clientes?.value || [];
    const clientesFiltrados = clientes
      .filter(c => c.País === paisSeleccionado)
      .sort((a, b) => a.Cliente.localeCompare(b.Cliente));

    const clienteSelect = document.getElementById("cliente");
    clienteSelect.innerHTML = "";

    if (clientesFiltrados.length === 0) {
      const opcion = document.createElement("option");
      opcion.value = "";
      opcion.textContent = "No hay clientes para este país";
      clienteSelect.appendChild(opcion);
    } else {
      clientesFiltrados.forEach(cliente => {
        const opcion = document.createElement("option");
        opcion.value = cliente.Cliente;
        opcion.textContent = cliente.Cliente;
        clienteSelect.appendChild(opcion);
      });
    }
  } catch (error) {
    console.error("Error al cargar los clientes:", error);
  }
}

// Función para actualizar el responsable y el correo según el país seleccionado
function actualizarResponsable() {
  const pais = document.getElementById('pais').value;
  let responsable = '';
  let email = '';

  switch (pais) {
    case 'Guatemala': responsable = 'Angélica Pineda'; email = 'aspineda@disagro.com'; break;
    case 'Honduras': responsable = 'Alejandra Alegría'; email = 'aalegria@disagro.com'; break;
    case 'El Salvador': responsable = 'César Quezada'; email = 'cequezada@disagro.com'; break;
    case 'Nicaragua': responsable = 'Cesia Herrera'; email = 'cherrera@disagro.com'; break;
    case 'Costa Rica': responsable = 'Luis Romero'; email = 'luis.romero@abopac.com'; break;
    case 'Panamá': responsable = 'Benigno Morales'; email = 'benigno.morales@abopac.com'; break;
    case 'Colombia': responsable = 'Mayra Mejía'; email = 'mmejia@precisagro.com.co'; break;
    case 'Ecuador': responsable = 'Joseph Prado'; email = 'jprado@precisagro.com.ec'; break;
  }

  document.getElementById('especialista').value = responsable;
  document.getElementById('email').value = email;
}

// Envío del formulario
async function enviarFormulario() {
  const fechaInicio = document.getElementById("fecha_inicio").value;
  const horaInicio = document.getElementById("hora_inicio").value;
  const horaFin = document.getElementById("hora_fin").value;

  const inicio = new Date(`${fechaInicio}T${horaInicio}`);
  const fin = new Date(`${fechaInicio}T${horaFin}`);

  if (fin <= inicio) {
    alert("La hora de fin debe ser mayor que la de inicio.");
    return;
  }

  const datos = {
    programaciones: [
      {
        pais: document.getElementById("pais").value,
        especialista: document.getElementById("especialista").value,
        email: document.getElementById("email").value,
        cliente: document.getElementById("cliente").value,
        producto: document.getElementById("producto").value,
        fecha_inicio: fechaInicio,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        asunto: document.getElementById("asunto").value,
        emails: document.getElementById("emails").value,
        mensaje: document.getElementById("mensaje").value
      }
    ]
  };

  const url = "https://prod-24.westus.logic.azure.com:443/workflows/c7eefd7b75e9417899ed455b878c4212/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vACIFhnbaTMAADO936K179YHbU3B80cRRN-aaGeHEio";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    if (response.ok) {
      alert("Espacio asignado correctamente.");
      document.getElementById("meeting-form").reset();

      actualizarResponsable();
      cargarClientes();
    } else {
      alert("Hubo un error para asignar el espacio.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Ocurrió un error al enviar el formulario.");
  }
}


// Generar horas de inicio y fin
function generarHorarios() {
  const horaInicioSelect = document.getElementById('hora_inicio');
  const horaFinSelect = document.getElementById('hora_fin');

  horaInicioSelect.innerHTML = '';
  horaFinSelect.innerHTML = '';

  const start = 8;
  const end = 16; // hasta las 16:30
  for (let h = start; h <= end; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const option = new Option(hora, hora);
      horaInicioSelect.appendChild(option);
    }
  }

  // Mostrar horas fin para la hora inicial por defecto
  actualizarHorasFin();
}

function actualizarHorasFin() {
  const horaInicio = document.getElementById('hora_inicio').value;
  const [h, m] = horaInicio.split(':').map(Number);
  const inicioMinutos = h * 60 + m;

  const horaFinSelect = document.getElementById('hora_fin');
  horaFinSelect.innerHTML = '';

  const end = 18 * 60; // 18:00 en minutos

  for (let minutos = inicioMinutos + 30; minutos <= end; minutos += 30) {
    const hora = `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
    const option = new Option(hora, hora);
    horaFinSelect.appendChild(option);
  }
}

document.getElementById("submit-btn").addEventListener("click", async function () {
  const btn = this;
  const spinner = document.getElementById("submit-spinner");
  const text = document.getElementById("submit-text");
  const feedback = document.getElementById("feedback-message");

  // Bloquear botón
  btn.disabled = true;
  text.style.display = "none";
  spinner.style.display = "inline-block";
  feedback.textContent = "";

  // Validación mínima de hora
  const fechaInicio = document.getElementById("fecha_inicio").value;
  const horaInicio = document.getElementById("hora_inicio").value;
  const horaFin = document.getElementById("hora_fin").value;
  const inicio = new Date(`${fechaInicio}T${horaInicio}`);
  const fin = new Date(`${fechaInicio}T${horaFin}`);
  if (fin <= inicio) {
    feedback.textContent = "La hora de fin debe ser mayor que la de inicio.";
    feedback.style.color = "red";
    resetBoton();
    return;
  }

  const datos = {
    programaciones: [{
      pais: document.getElementById("pais").value,
      especialista: document.getElementById("especialista").value,
      email: document.getElementById("email").value,
      cliente: document.getElementById("cliente").value,
      producto: document.getElementById("producto").value,
      fecha_inicio: fechaInicio,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      asunto: document.getElementById("asunto").value,
      emails: document.getElementById("emails").value,
      mensaje: document.getElementById("mensaje").value
    }]
  };

  const url = "https://prod-24.westus.logic.azure.com:443/workflows/c7eefd7b75e9417899ed455b878c4212/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vACIFhnbaTMAADO936K179YHbU3B80cRRN-aaGeHEio";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

if (response.ok) {
  feedback.textContent = "✅ Espacio asignado correctamente.";
  feedback.style.color = "green";
  document.getElementById("meeting-form").reset();

  actualizarResponsable();
  cargarClientes();

   setTimeout(() => {
    // 🔝 Scroll arriba suavemente
    window.scrollTo({ top: 0, behavior: "smooth" });

    // 🧹 Esperar 1 segundo más y limpiar el mensaje
    setTimeout(() => {
      feedback.textContent = "";
    }, 1000);
  }, 2000);
}
 else {
      feedback.textContent = "❌ Hubo un error al asignar el espacio.";
      feedback.style.color = "red";
    }
  } catch (error) {
    console.error("Error:", error);
    feedback.textContent = "❌ Error de red al enviar la solicitud.";
    feedback.style.color = "red";
  }

  resetBoton();

  function resetBoton() {
    btn.disabled = false;
    spinner.style.display = "none";
    text.style.display = "inline";
  }
});


// Al cargar el DOM
document.addEventListener('DOMContentLoaded', function () {
  console.log("Formulario cargado.");
  actualizarResponsable();
  cargarClientes();
  generarHorarios();
  document.getElementById('hora_inicio').addEventListener('change', actualizarHorasFin);
  window.onload = () => window.scrollTo({ top: 0 });

});
