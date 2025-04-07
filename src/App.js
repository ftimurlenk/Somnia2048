import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import './App.css';

const GRID_SIZE = 4;
const INITIAL_TILES = 2;

const SOMNIA_NETWORK = {
  chainId: '0xC488',
  chainName: 'Somnia Testnet',
  rpcUrls: ['https://dream-rpc.somnia.network'],
  nativeCurrency: { name: 'Somnia', symbol: 'STT', decimals: 18 },
  blockExplorerUrls: ['https://somnia-testnet.socialscan.io'],
};

const SOMNIA_CHAIN_ID = 50312;

const SCORE_CONTRACT_ABI = [
  "function setScore(uint256 _score) external",
  "function getScore(address _player) external view returns (uint256)",
  "function getLeaderboard() external view returns (tuple(address player, uint256 score)[])",
  "event ScoreUpdated(address indexed player, uint256 score)"
];

const SCORE_CONTRACT_ADDRESS = "0xbEBc424Db73e6819E4ED8D6b4bF8910Df84Db474";

const SUPPORTED_WALLETS = [
  { name: 'MetaMask', deepLink: (dappUrl) => `metamask://dapp/${dappUrl}`, installUrl: 'https://metamask.io/download.html' },
  { name: 'Zerion', deepLink: (dappUrl) => `zerion://dapp?url=${encodeURIComponent(dappUrl)}`, installUrl: 'https://zerion.io/' },
  { name: 'Rainbow', deepLink: (dappUrl) => `rainbow://dapp?url=${encodeURIComponent(dappUrl)}`, installUrl: 'https://rainbow.me/' },
  { name: 'OKX Wallet', deepLink: (dappUrl) => `okx://wallet/dapp?url=${encodeURIComponent(dappUrl)}`, installUrl: 'https://www.okx.com/web3' },
];

const App = () => {
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [mergedTiles, setMergedTiles] = useState([]);
  const [newTiles, setNewTiles] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [contract, setContract] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [showWalletPrompt, setShowWalletPrompt] = useState(true);
  const [networkError, setNetworkError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [walletNotFound, setWalletNotFound] = useState(false);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOnSomniaNetwork, setIsOnSomniaNetwork] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const switchToSomniaNetwork = useCallback(async () => {
    try {
      if (!window.ethereum) throw new Error('No Ethereum provider found');
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId, 16);

      if (currentChainId !== SOMNIA_CHAIN_ID) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SOMNIA_NETWORK.chainId }],
        });
      }
      setNetworkError(null);
      setIsOnSomniaNetwork(true);
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SOMNIA_NETWORK],
          });
          setNetworkError(null);
          setIsOnSomniaNetwork(true);
        } catch (addError) {
          setNetworkError('Failed to add Somnia Network: ' + addError.message);
        }
      } else {
        setNetworkError('Failed to switch to Somnia Network: ' + switchError.message);
      }
    }
  }, []);

  const checkNetwork = useCallback(async () => {
    try {
      if (!window.ethereum) return;
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId, 16);
      setIsOnSomniaNetwork(currentChainId === SOMNIA_CHAIN_ID);
      if (currentChainId !== SOMNIA_CHAIN_ID) {
        if (isMobile) await switchToSomniaNetwork();
        else setNetworkError('Please switch to Somnia Network to continue.');
      } else {
        setNetworkError(null);
      }
    } catch (error) {
      setNetworkError('Error checking network: ' + error.message);
    }
  }, [switchToSomniaNetwork, isMobile]);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    if (!window.ethereum) {
      setWalletNotFound(true);
      setShowWalletOptions(true);
      setIsConnecting(false);
      return;
    }

    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = await web3Provider.getSigner();
      const address = accounts[0];

      await checkNetwork();

      if (!networkError) {
        const scoreContract = new ethers.Contract(SCORE_CONTRACT_ADDRESS, SCORE_CONTRACT_ABI, signer);
        setContract(scoreContract);
        setWalletAddress(address);
        setScore(0);
        setShowWalletPrompt(false);
        setNetworkError(null);

        await fetchLeaderboard(scoreContract);
      }
    } catch (error) {
      setNetworkError('Failed to connect wallet: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  }, [checkNetwork, networkError]);

  const connectWithWallet = (wallet) => {
    setIsConnecting(true);
    const dappUrl = window.location.href;
    const deepLink = wallet.deepLink(dappUrl);
    window.location.href = deepLink;
    setNetworkError(`Opening ${wallet.name}... Please return to this page in the wallet's browser to connect.`);
    setTimeout(() => {
      setIsConnecting(false);
      setShowWalletOptions(false);
    }, 1000);
  };

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    setContract(null);
    setScore(0);
    setShowWalletPrompt(true);
    setNetworkError(null);
    setShowWalletOptions(false);
    setIsConnecting(false);
    setIsOnSomniaNetwork(false);
  }, []);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileCheck = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    setIsMobile(mobileCheck);
    if (mobileCheck && window.ethereum && !walletAddress && !isConnecting) {
      connectWallet();
    }
  }, [walletAddress, isConnecting, connectWallet]);

  useEffect(() => {
    const initialGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    for (let i = 0; i < INITIAL_TILES; i++) {
      addRandomTile(initialGrid);
    }
    setGrid(initialGrid);
  }, []);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(SOMNIA_NETWORK.rpcUrls[0]);
        const scoreContract = new ethers.Contract(SCORE_CONTRACT_ADDRESS, SCORE_CONTRACT_ABI, provider);
        await fetchLeaderboard(scoreContract);
      } catch (error) {
        setNetworkError("Failed to load leaderboard: " + error.message);
      }
    };
    loadLeaderboard();
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) disconnectWallet();
      else connectWallet();
    };
    const handleChainChanged = async () => {
      await checkNetwork();
      if (!networkError) connectWallet();
    };
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [checkNetwork, connectWallet, networkError, disconnectWallet]);

  function addRandomTile(grid) {
    let emptyCells = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      let { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      grid[r][c] = Math.random() > 0.1 ? 2 : 4;
      setNewTiles(prev => [...prev, `${r}-${c}`]);
    }
  }

  const checkGameOver = (grid) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === 0) return false;
      }
    }
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 1; c++) {
        if (grid[r][c] === grid[r][c + 1]) return false;
      }
    }
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 1; r++) {
        if (grid[r][c] === grid[r + 1][c]) return false;
      }
    }
    return true;
  };

  const moveGrid = useCallback((direction) => {
    let newGrid = JSON.parse(JSON.stringify(grid));
    let moved = false;
    let newScore = score;
    let tempMerged = [];

    const slide = (row) => {
      let arr = row.filter(val => val);
      let result = [];
      for (let i = 0; i < arr.length; i++) {
        if (i < arr.length - 1 && arr[i] === arr[i + 1]) {
          result.push(arr[i] * 2);
          newScore += arr[i] * 2;
          tempMerged.push(result.length - 1);
          i++;
        } else {
          result.push(arr[i]);
        }
      }
      return [...result, ...Array(GRID_SIZE - result.length).fill(0)];
    };

    if (direction === 'left' || direction === 'right') {
      for (let r = 0; r < GRID_SIZE; r++) {
        let row = newGrid[r];
        if (direction === 'right') row = row.reverse();
        let newRow = slide(row);
        if (direction === 'right') newRow = newRow.reverse();
        if (newRow.join('') !== newGrid[r].join('')) moved = true;
        newGrid[r] = newRow;
        tempMerged.forEach(idx => setMergedTiles(prev => [...prev, `${r}-${newRow.indexOf(newRow[idx])}`]));
        tempMerged = [];
      }
    } else {
      for (let c = 0; c < GRID_SIZE; c++) {
        let col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
        if (direction === 'down') col = col.reverse();
        let newCol = slide(col);
        if (direction === 'down') newCol = newCol.reverse();
        for (let r = 0; r < GRID_SIZE; r++) {
          if (newGrid[r][c] !== newCol[r]) moved = true;
          newGrid[r][c] = newCol[r];
        }
        tempMerged.forEach(idx => setMergedTiles(prev => [...prev, `${newCol.indexOf(newCol[idx])}-${c}`]));
        tempMerged = [];
      }
    }

    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      setMergedTiles([]);
      setNewTiles([]);
      setGameOver(checkGameOver(newGrid));
    }
  }, [grid, score]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'ArrowUp': moveGrid('up'); break;
        case 'ArrowDown': moveGrid('down'); break;
        case 'ArrowLeft': moveGrid('left'); break;
        case 'ArrowRight': moveGrid('right'); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [moveGrid]);

  useEffect(() => {
    const gridElement = document.querySelector('.grid');
    if (!gridElement) return;

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      e.preventDefault();
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const minSwipeDistance = 30;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) moveGrid('right');
          else moveGrid('left');
        }
      } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0) moveGrid('down');
          else moveGrid('up');
        }
      }
    };

    gridElement.addEventListener('touchstart', handleTouchStart);
    gridElement.addEventListener('touchmove', handleTouchMove);
    gridElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      gridElement.removeEventListener('touchstart', handleTouchStart);
      gridElement.removeEventListener('touchmove', handleTouchMove);
      gridElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [moveGrid]);

  const resetGame = () => {
    const initialGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    for (let i = 0; i < INITIAL_TILES; i++) {
      addRandomTile(initialGrid);
    }
    setGrid(initialGrid);
    setScore(0);
    setMergedTiles([]);
    setNewTiles([]);
    setGameOver(false);
    setScoreSaved(false);
  };

  const saveScoreToBlockchain = async () => {
    if (!contract || !walletAddress) return;
    try {
      const tx = await contract.setScore(score);
      await tx.wait();
      setScoreSaved(true);
      await fetchLeaderboard(contract);
    } catch (error) {
      setNetworkError("Failed to save score: " + error.message);
    }
  };

  const fetchLeaderboard = async (contractInstance) => {
    if (!contractInstance) return;
    try {
      const leaderboardData = await contractInstance.getLeaderboard();
      const formattedLeaderboard = leaderboardData.map(entry => ({
        player: entry.player,
        score: entry.score.toString()
      }));
      setLeaderboard(formattedLeaderboard);
    } catch (error) {
      setNetworkError("Failed to fetch leaderboard: " + error.message);
    }
  };

  const handleWalletPrompt = (connect) => {
    if (connect) connectWallet();
    else setShowWalletPrompt(false);
  };

  const shortenAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="game-container">
      <div className="header">
        <h1>Somnia2048</h1>
      </div>
      <div className="main-content">
        <div className="game-section">
          <div className="grid">
            {grid.map((row, rowIndex) =>
              row.map((tile, colIndex) => {
                const key = `${rowIndex}-${colIndex}`;
                const isMerged = mergedTiles.includes(key);
                const isNew = newTiles.includes(key);
                return (
                  <div
                    key={key}
                    className={`tile tile-${tile} ${isMerged ? 'tile-merged' : ''} ${isNew ? 'tile-new' : ''}`}
                    data-value={tile !== 0 ? tile : ''}
                  />
                );
              })
            )}
          </div>
          <div className="score-board">Score: {score}</div>
          <div className="wallet-wrapper">
            {walletAddress ? (
              <div className="wallet-address-section">
                <span className="wallet-address">{shortenAddress(walletAddress)}</span>
                {isMobile && !isOnSomniaNetwork && (
                  <button
                    className="add-network-button modern-button"
                    onClick={switchToSomniaNetwork}
                  >
                    Add Somnia Network
                  </button>
                )}
                <button className="disconnect-button modern-button" onClick={disconnectWallet}>
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                className="connect-wallet modern-button"
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
            {networkError && <p className="network-error">{networkError}</p>}
            {walletNotFound && isMobile && showWalletOptions && (
              <div className="wallet-options-popup">
                <div className="popup-content">
                  <h2>Select a Wallet</h2>
                  <p>Please select a wallet to connect:</p>
                  <div className="button-group">
                    {SUPPORTED_WALLETS.map((wallet) => (
                      <button
                        key={wallet.name}
                        className="wallet-option-button modern-button"
                        onClick={() => connectWithWallet(wallet)}
                        disabled={isConnecting}
                      >
                        {wallet.name}
                      </button>
                    ))}
                  </div>
                  <button
                    className="close-button modern-button"
                    onClick={() => setShowWalletOptions(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
            {walletNotFound && !isMobile && (
              <p className="network-error">
                Wallet not detected. Please install a compatible wallet like MetaMask.
                <a href="https://metamask.io/download.html" target="_blank" rel="noopener noreferrer">
                  Install MetaMask
                </a>
              </p>
            )}
          </div>
        </div>
        <div className="rules-section">
          <div className="wallet-section-bottom">
            <div className="leaderboard-card">
              <div className="leaderboard-header">
                <h2>Leaderboard</h2>
                <button
                  className="refresh-button modern-button small-button"
                  onClick={() => fetchLeaderboard(contract || new ethers.Contract(SCORE_CONTRACT_ADDRESS, SCORE_CONTRACT_ABI, new ethers.JsonRpcProvider(SOMNIA_NETWORK.rpcUrls[0])))}
                >
                  Refresh
                </button>
              </div>
              {leaderboard.length > 0 ? (
                <ul className="leaderboard-list">
                  {leaderboard.map((entry, index) => (
                    <li key={index} className="leaderboard-item">
                      <span className="leaderboard-rank">{index + 1}</span>
                      <span className="leaderboard-player">{shortenAddress(entry.player)}</span>
                      <span className="leaderboard-score">{entry.score}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-scores">No scores yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="contact-section">
        <a href="https://x.com/timurwp1" target="_blank" rel="noopener noreferrer" className="x-icon">
          𝕏
        </a>
        <a href="mailto:timurlenkfirat@gmail.com" className="mail-icon">
          ✉️
        </a>
      </div>
      {showWalletPrompt && (
        <div className="wallet-prompt-popup">
          <div className="popup-content">
            <h2>Connect Wallet</h2>
            <p>Would you like to connect your wallet to Somnia Network?</p>
            <div className="button-group">
              <button className="yes-button modern-button" onClick={() => handleWalletPrompt(true)}>Yes</button>
              <button className="no-button modern-button" onClick={() => handleWalletPrompt(false)}>No</button>
            </div>
          </div>
        </div>
      )}
      {gameOver && !showWalletPrompt && (
        <div className="game-over-popup">
          <div className="popup-content">
            <h2>Game Over!</h2>
            <p>Your Score: {score}</p>
            <div className="button-group">
              <button className="restart-button modern-button" onClick={resetGame}>Restart</button>
              {walletAddress && !scoreSaved && (
                <button className="save-score-button modern-button" onClick={saveScoreToBlockchain}>
                  Save Score to Somnia Network
                </button>
              )}
            </div>
            {scoreSaved && <p className="score-saved-message">Score successfully saved!</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;