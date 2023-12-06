import React, { useState } from 'react';
import GraphChart from './GraphChart';
import './styles.css';

function App () {
  const [currentView, setCurrentView] = useState('home');
  const [selectedFilename, setSelectedFilename] = useState('');

  const handleRDSUpgradePaths = (filename) => {
    setSelectedFilename(filename);
    setCurrentView('chart');
  };

  const handleBack = () => {
    setCurrentView('home');
  };

  return (
    <div className="App">
      <header style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1>anton-yurchenko.github.io</h1>
      </header>

      <main style={{ height: '100%', position: 'relative' }}>
        {currentView === 'home' && (
          <div className="home-view">
            <nav>
              <ul>
                <li className="group">
                  <p><strong>AWS RDS Upgrade Paths</strong></p>
                  Node colors indicate what type of upgrade is available from<br></br>
                  this version on:<br></br>
                  <br></br>
                  <strong>Grey</strong> - legacy upgrade with failover and downtime<br></br>
                  <strong>Green</strong> - blue/green deployment is supported<br></br>
                  <br></br>
                  <button onClick={() => handleRDSUpgradePaths('/aws/rds-upgrade-paths/postgres.json')}>
                    PostgreSQL
                  </button>
                  <button onClick={() => handleRDSUpgradePaths('/aws/rds-upgrade-paths/mysql.json')}>
                    MySQL
                  </button>
                  <button onClick={() => handleRDSUpgradePaths('/aws/rds-upgrade-paths/mariadb.json')}>
                    MariaDB
                  </button>
                  <button onClick={() => handleRDSUpgradePaths('/aws/rds-upgrade-paths/aurora-postgres.json')}>
                    Aurora PostgreSQL
                  </button>
                  <button onClick={() => handleRDSUpgradePaths('/aws/rds-upgrade-paths/aurora-mysql.json')}>
                    Aurora MySQL
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}

        {currentView === 'chart' && (
          <div className="chart-view" style={{ height: '100%' }}>
            <GraphChart filename={selectedFilename} />
          </div>
        )}
      </main>

      <footer style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {currentView === 'chart' && (
          <button onClick={handleBack}>Back</button>
        )}
      </footer>
    </div>
  );
}

export default App;
