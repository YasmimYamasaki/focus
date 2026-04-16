document.addEventListener('DOMContentLoaded', loadTickets);

/*LOAD TICKETS*/
//corrigido
async function loadTickets() {
  try {
    const res = await fetch('php/supportController.php');
    const data = await res.json();

    if (data.success) {
      renderTable(data.tickets);
    }

  } catch {
    showAlert('Error loading tickets', 'error');
  }
}

/*RENDER TABLE*/
function renderTable(tickets) {

  const tbody = document.querySelector('#table tbody');
  tbody.innerHTML = '';

  tickets.forEach(t => {

    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>#${t.id}</td>
      <td>${t.name}</td>
      <td>${t.subject}</td>

      <td>
        <select onchange="updateStatus(${t.id}, this.value)">
          <option value="open" ${t.status === 'open' ? 'selected' : ''}>Open</option>
          <option value="in_progress" ${t.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
          <option value="resolved" ${t.status === 'resolved' ? 'selected' : ''}>Resolved</option>
        </select>
      </td>

      <td>
        <button onclick='viewDetails(${JSON.stringify(t)})'>
          View
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/*UPDATE STATUS*/
async function updateStatus(id, status) {

  const fd = new FormData();
  fd.append('id', id);
  fd.append('status', status);

  try {
    const res = await fetch('php/supportController.php?action=status', {
      method: 'POST',
      body: fd
    });

    const data = await res.json();

    showAlert(data.message, data.success ? 'success' : 'error');

  } catch {
    showAlert('Error updating status', 'error');
  }
}

/*VIEW DETAILS*/
function viewDetails(t) {
  alert(`
Name: ${t.name}
Email: ${t.email}
Category: ${t.category}
Priority: ${t.priority}
Message: ${t.message}
`);
}

/*ALERT*/
function showAlert(msg, type) {

  const alert = document.getElementById('alert');

  alert.textContent = msg;
  alert.className = type;
  alert.style.display = 'block';

  setTimeout(() => alert.style.display = 'none', 3000);
}