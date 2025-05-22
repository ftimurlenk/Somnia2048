import React from 'react';

const StartScreen = ({ onStart }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
        <h2 className="text-3xl font-bold mb-4">2048</h2>
        <p className="mb-6 text-gray-700">Birleştirerek 2048'e ulaş!</p>
        <button
          onClick={onStart}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-xl transition-all"
        >
          Oyunu Başlat
        </button>
      </div>
    </div>
  );
};

export default StartScreen;
