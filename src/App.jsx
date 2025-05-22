import React, { useEffect, useState } from 'react';
import './styles/index.css';

import GameGrid from './components/GameGrid';
import GameOverPopup from './components/GameOverPopup';
import useGameLogic from './hooks/useGameLogic';
import { submitScore } from './api/scoreApi'; // Skor API'si
import Leaderboard from './components/Leaderboard';
import { getPrimarySomName } from './lib/sds.ts';

const App = () => {
  const {
    grid,
    score,
    gameOver,
    gameStarted,
    setGameStarted,
    handleKeyDown,
    restartGame
  } = useGameLogic();

  const [wallet, setWallet] = useState(null);

  // Cüzdan bağlama
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWallet(accounts[0]);
      } catch (err) {
        console.error("Cüzdan bağlantı hatası:", err);
      }
    } else {
      alert("Metamask yüklü değil!");
    }
  };

  // Cüzdan bağlantısını kesme
  const disconnectWallet = () => {
    setWallet(null);
  };

  // Sayfa yüklendiğinde cüzdan bağlı mı kontrol et, adres değişirse güncelle
  useEffect(() => {
    const checkWalletConnected = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) setWallet(accounts[0]);
      }
    };
    checkWalletConnected();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setWallet(accounts[0]);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (gameStarted) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, gameStarted]);

  // Oyun bittiğinde skor gönder (wallet bağlıysa)
  useEffect(() => {
    if (gameOver && wallet && score > 0) {
      const sendScore = async () => {
        try {
          await submitScore(wallet, score);
          console.log('Skor başarıyla gönderildi.');
        } catch (error) {
          console.error('Skor gönderme hatası:', error);
        }
      };
      sendScore();
    }
  }, [gameOver, wallet, score]);

  return (
   <div>
    <h1 className="app-title">Somnia2048</h1>
	    <div className="app-container">
      <div className="top-bar">
 

  <div className="score-container">
    <div className="score-box">Score: {score}</div>
  </div>
   <div className="wallet-connection">
    {wallet ? (
      <div className="wallet-connected">
        <span className="wallet-address">
          {wallet.substring(0, 6)}...{wallet.slice(-4)}
        </span>
        <button className="btn btn-disconnect" onClick={disconnectWallet}>Disconnect</button>
      </div>
    ) : (
      <button className="btn btn-connect" onClick={connectWallet}>Connect Wallet</button>
    )}
  </div>
</div>

      <div className="game-area">
        <GameGrid grid={grid} />
        <Leaderboard />
      </div>

      {!gameStarted && (
        <div className="start-screen">
          <h2>Welcome to Somnia2048</h2>
          <button onClick={() => setGameStarted(true)}>Start Game</button>
        </div>
      )}

      {gameOver && (
        <GameOverPopup score={score} onRestart={restartGame} />
      )}

      {/* Cüzdan bağlı değilse tam ekran popup */}
      {!wallet && (
        <div className="wallet-popup-overlay">
          <div className="wallet-popup">
            <h2>Wallet Must Be Connected</h2>
            <p>Please connect your wallet to continue playing.</p>
            <button className="btn btn-connect" onClick={connectWallet}>Connect</button>
          </div>
        </div>
      )}
    </div></div>
  );
};

export default App;
