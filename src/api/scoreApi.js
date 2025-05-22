export const submitScore = async (wallet, score) => {
  const response = await fetch('https://game-backend-production-a221.up.railway.app/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet, score }),
  });

  if (!response.ok) {
    throw new Error('Skor gönderimi başarısız.');
  }
  
  return await response.json();
};
