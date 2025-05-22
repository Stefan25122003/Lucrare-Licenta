import React from 'react';

const QRInstructions = () => {
  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <h3 className="text-lg font-bold mb-2">Cum să folosești codul QR</h3>
      <ol className="list-decimal pl-5 space-y-2">
        <li>Scanează codul QR cu camera telefonului sau cu o aplicație de scanare QR.</li>
        <li>Vei fi redirecționat direct la pagina de vot pentru acest sondaj.</li>
        <li>Autentifică-te (dacă este necesar) și exprimă-ți votul în mod anonim.</li>
        <li>Poți distribui codul QR și altor persoane pentru a vota în acest sondaj.</li>
      </ol>
      <div className="mt-3 text-sm text-gray-600">
        Notă: Fiecare persoană poate vota o singură dată, indiferent de dispozitivul folosit.
      </div>
    </div>
  );
};

export default QRInstructions;