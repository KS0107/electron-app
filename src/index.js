const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let mainWindow;
let db;

function createDatabase() {
  db = new sqlite3.Database('jobDB.db', (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Connected to the SQLite database.');
      createTable(insertRandomJobs); // Create table and then insert jobs
    }
  });
}

function createTable(callback) {
  db.run(`CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT,
    location TEXT,
    description TEXT,
    status TEXT,
    created_at TEXT
  )`, (err) => {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log('Table created');
    callback(); // Call the callback function to insert jobs after table creation
  });
}

function insertRandomJobs() {
  for (let i = 0; i < 10; i++) {
    const job = getRandomJob();
    const sql = `INSERT INTO jobs (title, company, location, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [job.title, job.company, job.location, job.description, job.status, job.created_at], function(err) {
      if (err) {
        console.error(err.message);
      } else {
        console.log(`A row has been inserted with rowid ${this.lastID}`);
      }
    });
  }
}

function insertJob(title, company, location, description, status, created_at) {
  const sql = `INSERT INTO jobs (title, company, location, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(sql, [title, company, location, description, status, created_at], function(err) {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`A row has been inserted with rowid ${this.lastID}`);
      getAllJobs(); // Optionally refresh the job list after adding a new job
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  // mainWindow.webContents.openDevTools();

  // IPC listener for the renderer's request to load jobs
  ipcMain.on('request-jobs', (event) => {
    getAllJobs();
  });
  ipcMain.on('delete-jobs', (event) => {
    clearDatabase();
  });
  ipcMain.on('add-job', (event, job) => {
    insertJob(job.title, job.company, job.location, job.description, job.status, job.created_at);
  });
}

app.on('ready', () => {
  createDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') {
  //   db.close((err) => {
  //     if (err) {
  //       console.error(err.message);
  //     }
  //     console.log('Closed the database connection.');
  //   });
  //   app.quit();
  // }
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function getAllJobs() {
  const sql = `SELECT * FROM jobs`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return;
    }
    mainWindow.webContents.send('jobs-data', rows);
  });
}

function getRandomJob() {
  const titles = ['Software Developer', 'Project Manager', 'Graphic Designer', 'Data Analyst'];
  const companies = ['Tech Corp', 'Design Studio', 'Data Inc.', 'Innovate LLC'];
  const locations = ['New York', 'San Francisco', 'Austin', 'Seattle'];
  const descriptions = ['Lorem ipsum dolor sit amet', 'Consectetur adipiscing elit', 'Sed do eiusmod tempor incididunt', 'Ut labore et dolore magna aliqua'];
  const statuses = ['Open', 'Closed', 'Pending'];

  return {
    title: titles[Math.floor(Math.random() * titles.length)],
    company: companies[Math.floor(Math.random() * companies.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    created_at: new Date().toISOString()
  };
}

function clearDatabase() {
  const sql = `DELETE FROM jobs`;
  db.run(sql, [], (err) => {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log('Database cleared');
  });
}



ipcMain.on('update-job', (event, job) => {
  updateJob(job);
});

function updateJob(job) {
  const sql = `UPDATE jobs SET title = ?, company = ?, location = ?, description = ?, status = ?, created_at = ? WHERE id = ?`;
  db.run(sql, [job.title, job.company, job.location, job.description, job.status, job.created_at, job.id], function(err) {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`Job updated with rowid ${job.id}`);
      getAllJobs(); // Refresh the job list
    }
  });
}

