const { ipcRenderer } = require('electron');

function loadJobs() {
  ipcRenderer.send('request-jobs');
}

function clearJobs() {
  ipcRenderer.send('delete-jobs');
}

ipcRenderer.on('jobs-data', (event, jobs) => {
  const tableContainer = document.getElementById('jobs-table-container');
  tableContainer.innerHTML = ''; // Clear existing content

  const table = document.createElement('table');
  table.style.width = '100%';
  table.createTHead().innerHTML = '<tr><th>Title</th><th>Company</th><th>Location</th><th>Description</th><th>Status</th></tr>';

  const tbody = table.createTBody();
  const statusCount = {
    Submitted: 0,
    Waiting: 0,
    Assessment: 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0,
  };

  jobs.forEach(job => {
    const row = tbody.insertRow();
    row.innerHTML = `<td>${job.title}</td><td>${job.company}</td><td>${job.location}</td><td>${job.description}</td><td>${job.status}</td>`;
    row.addEventListener('click', () => editJob(job, row)); // Pass the row as well

    // Update status count
    if (statusCount.hasOwnProperty(job.status)) {
      statusCount[job.status]++;
    }
  });

  // Calculate and update the percentages
  const totalJobs = jobs.length;
  for (const status in statusCount) {
    const thCount = document.getElementById(status.toLowerCase() + '-count');
    const tdPercentage = document.getElementById(status.toLowerCase() + '-percentage');
    
    if (thCount && tdPercentage) {
      const count = statusCount[status];
      const percentage = (count / totalJobs * 100).toFixed(2); // Calculate percentage with two decimal places
      thCount.textContent = `${count}`;
      tdPercentage.textContent = `${percentage}%`;
    }
  }

  tableContainer.appendChild(table);
});


document.getElementById('jobForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const jobId = document.getElementById('jobId').value;
  const job = {
    id: jobId,
    title: document.getElementById('title').value,
    company: document.getElementById('company').value,
    location: document.getElementById('location').value,
    description: document.getElementById('description').value,
    status: document.getElementById('status').value,
    created_at: new Date().toISOString()
  };

  if (jobId) {
    ipcRenderer.send('update-job', job);
  } else {
    ipcRenderer.send('add-job', job);
  }
});

function editJob(job, rowElement) {
  document.getElementById('jobId').value = job.id;
  document.getElementById('title').value = job.title;
  document.getElementById('company').value = job.company;
  document.getElementById('location').value = job.location;
  document.getElementById('description').value = job.description;
  document.getElementById('status').value = job.status;
  document.getElementById('jobFormButton').textContent = 'Edit Job';
  document.getElementById('heading').textContent = 'Editing Job';

  // Highlight the selected row
  const previouslySelected = document.querySelector('.highlighted');
  if (previouslySelected) {
    previouslySelected.classList.remove('highlighted');
  }
  rowElement.classList.add('highlighted');

  document.getElementById('jobForm').scrollIntoView();
}

ipcRenderer.on('jobs-data', (event, jobs) => {
  // Existing code to populate the jobs table
  resetForm();
});

function resetForm() {
  document.getElementById('jobForm').reset();
  document.getElementById('jobId').value = '';
  document.getElementById('jobFormButton').textContent = 'Add Job';
  document.getElementById('heading').textContent = 'Add a Job Application';
}
