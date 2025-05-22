import React, { useEffect, useState } from 'react';
import { getPrimarySomName } from '../lib/sds.ts'; // Yolunu projenize göre ayarla

const Leaderboard = () => {
  const [scores, setScores] = useState([]);
  const [domains, setDomains] = useState({}); // wallet -> domain eşlemesi

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await fetch('https://game-backend-production-a221.up.railway.app/api/scores/leaderboard');
        const data = await res.json();
        setScores(data);

        // Domain isimlerini paralel çek
        const domainMap = {};
        await Promise.all(
          data.map(async (item) => {
            const domain = await getPrimarySomName(item.wallet);
            if (domain) domainMap[item.wallet] = domain;
          })
        );
        setDomains(domainMap);
      } catch (err) {
        console.error('Liderlik tablosu alınamadı:', err);
      }
    };

    fetchScores();
  }, []);

  return (
    <div className="leaderboard">
      <h2>🏆 Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Domain / Wallet</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((item, index) => (
            <tr key={item._id}>
              <td>{index + 1}</td>
              <td>
                {domains[item.wallet]
                  ? domains[item.wallet]
                  : `${item.wallet.slice(0, 6)}...${item.wallet.slice(-4)}`}
              </td>
              <td>{item.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
