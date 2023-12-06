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
            <p><strong>AWS RDS Upgrade Strategy</strong></p>
            There are three ways upgrading an AWS RDS cluster:<br></br>
            1. (simple) Modify engine and apply changes. This approach will surely cause a long downtime, depending the upgrade itself.<br></br>
            2. (blue/green) Creates a copy of a cluster and constantly replicates changes to it. Allows to perform multiple upgrades on the target cluster before promoting it.<br></br>
            3. (migration) A separate cluster upgraded to the required versions with DMS replicating the data from source. This approach has its own limitations like: "operator need to install the addons as they are not getting replicated"<br></br>
            <br></br>
            I recommend doing a "simple" upgrade of non-mission-critical databases that may withstand a downtime of up to 40 minutes.<br></br>
            For mission-critical databases, the "blue/green" approach is the most suitable. Although sometimes the original engine version needs to be upgraded to a blue/green supported version using either a "simple" or "migration" approach.<br></br>
            <br></br>
            Mission-critical databases maintenance should be carefully planned, multiple upgrades need to be done with no downtime, and the most important, future maintenance should not get complicated.<br></br>
            In order to achieve this, one needs to plan an upgrade path from version A to version D in such a way that version D will support a "blue/green" deployment, so the future upgrades will be easier.<br></br>
            <br></br>
            This small web application helps planning this path.<br></br>
            Select a relevant engine and drag aside a node with the current version engine.<br></br>
            Select a target node with the desired version, make sure it is a "green" node as it support "blue/green" deployment, required for future upgrades.<br></br>
            Now, drag aside as minimum nodes as possible in order to speed up the maintenance process by decrease the upgrade "chain".<br></br>
            Try to move to "green" node as fast as possible, because every upgrade performed from a "grey" node will require either a downtime or a "migration" approach, which will complicate the whole maintenance process.<br></br>
            If you choose the first upgrade hop to be "simple" (with downtime), then look for non-major upgrade in order to move to the "green" node. This will make that downtime as short as possible.<br></br>
            <br></br>
            Node colors indicate what type of upgrade is available from this version on:<br></br>
            <strong>Grey</strong> - legacy upgrade with failover and downtime<br></br>
            <strong>Green</strong> - blue/green deployment is supported<br></br>
            <nav>
              <ul>
                <li className="group">
                  <button onClick={() => handleRDSUpgradePaths('/aws/rds-upgrade-paths/postgres.json')}>
                    PostgreSQL
                  </button>
                  <button onClick={() => handleRDSUpgradePaths('/aws/rds-upgrade-paths/mysql.json')}>
                    MySQL
                  </button>
                  <button onClick={() => handleRDSUpgradePaths('/aws/rds-upgrade-paths/mariadb.json')}>
                    MariaDB
                  </button>
                  <button onClick={() => handleRDSUpgradePaths('/aws/rds-upgrade-paths/aurora-postgresql.json')}>
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
