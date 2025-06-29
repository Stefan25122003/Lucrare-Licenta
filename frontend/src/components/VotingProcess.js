import React, { useState } from 'react';
import {
  ShieldCheck,
  LockKeyhole,
  Eye,
  CheckCircle2,
  ArrowDownToLine,
  X
} from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: ShieldCheck,
    title: 'Semnătură Oarbă',
    description:
      'Autoritatea semnează buletinul tău fără să știe ce conține.\nGândește-ţi un plic opac cu o ştampilă aplicată peste el.',
    color: 'purple',
    details: `Blind Signature:
- Se aplică un blinding factor r: m' = m * r^e mod n
- Autoritatea semnează m' → s' = (m')^d mod n
- Deblindezi: s = s' * r^(-1) mod n`,
    explanation: `Imaginează-ți că vrei o semnătură oficială pe un document, dar nu vrei ca autoritatea să vadă conținutul. Așa că îl "învelești" într-un strat opac (blinding), autoritatea îl semnează, apoi tu îl desfaci (unblind) și obții semnătura pe documentul original – fără ca cineva să fi văzut ce ai scris.`
  },
  {
    id: 2,
    icon: LockKeyhole,
    title: 'Criptare Homomorfă',
    description:
      'Votul e criptat astfel încât se poate număra fără a fi vizibil individual.\nO cutie care le adună toate, fără să se deschidă.',
    color: 'green',
    details: `Ex: Criptare Paillier:
- Enc(m1) * Enc(m2) = Enc(m1 + m2)
- Public key: n, g
- C(m) = g^m * r^n mod n^2`,
    explanation: `Fiecare vot e pus într-o cutie încuiată (criptat), dar cutiile pot fi adunate direct fără a fi deschise. La final, doar suma totală e decriptată. Nimeni nu poate vedea voturile individuale, dar rezultatul global e corect.`
  },
  {
    id: 3,
    icon: Eye,
    title: 'Zero‑Knowledge Proof',
    description:
      'Dovedeşti că ai votat corect (fix o opțiune), fără să dezvălui care.\nE ca o dovadă „invizibilă” a corectitudinii.',
    color: 'orange',
    details: `Zero-Knowledge Proof:
- Prover dovedește că m ∈ {0,1}
- Fără să dezvăluie m
- Se folosesc protocoale interactive sau zk-SNARKs`,
    explanation: `Este ca atunci când cineva vrea să dovedească că știe o parolă, fără să o spună. Sistemul îl "testează" cu întrebări, iar răspunsurile corecte arată că știe parola, fără să o spună niciodată. La vot, dovedești că ai votat o opțiune validă, fără să spui care.`
  }
];

const VotingProcess = () => {
  const [openMath, setOpenMath] = useState(null);
  const [openExplain, setOpenExplain] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-8">
      <div className="max-w-3xl mx-auto space-y-16">

        {/* Introducere */}
        <section className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Proces de Votare Simplificat
          </h1>
          <p className="text-gray-600 text-lg">
            Parcurge cele 3 etape esențiale pentru un vot securizat, anonim și verificabil.
          </p>
          <div className="mt-6 animate-bounce text-gray-400">
            <ArrowDownToLine className="w-7 h-7 mx-auto" />
          </div>
        </section>

        {/* Pași */}
        <section className="space-y-12">
          {steps.map(({ id, icon: Icon, title, description, color }) => (
            <div
              key={id}
              className={`flex flex-col md:flex-row items-start space-x-0 md:space-x-4 rounded-xl p-6 shadow-md border-l-4 border-${color}-500 bg-${color}-50`}
            >
              <div className="flex-shrink-0 bg-white rounded-full p-4 shadow mb-4 md:mb-0">
                <Icon className={`w-10 h-10 text-${color}-600`} />
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-semibold text-${color}-800 mb-2`}>
                  {id}. {title}
                </h2>
                <p className="text-gray-700 whitespace-pre-line mb-3">{description}</p>
                <div className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
                  <button
                    onClick={() => setOpenMath(id)}
                    className={`text-sm text-${color}-700 hover:underline font-medium`}
                  >
                    Află detalii matematice
                  </button>
                  <button
                    onClick={() => setOpenExplain(id)}
                    className={`text-sm text-${color}-700 hover:underline font-medium`}
                  >
                    Cum funcționează?
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Dialog detalii matematice */}
        {openMath && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 max-w-md w-full relative shadow-xl">
              <button
                onClick={() => setOpenMath(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Detalii matematice – {steps.find(s => s.id === openMath).title}
              </h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {steps.find(s => s.id === openMath).details}
              </pre>
            </div>
          </div>
        )}

        {/* Dialog explicație logică */}
        {openExplain && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 max-w-md w-full relative shadow-xl">
              <button
                onClick={() => setOpenExplain(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Cum funcționează – {steps.find(s => s.id === openExplain).title}
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {steps.find(s => s.id === openExplain).explanation}
              </p>
            </div>
          </div>
        )}

        {/* Beneficii */}
        <section>
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Beneficii Cheie
          </h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <div className="text-sm font-medium text-green-800">
                  Anonimitate completă
                </div>
                <p className="text-xs text-gray-600">
                  Nimeni nu poate asocia identitatea ta cu votul exprimat.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <LockKeyhole className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <div className="text-sm font-medium text-blue-800">
                  Confidențialitate matematică
                </div>
                <p className="text-xs text-gray-600">
                  Criptarea permite numărarea fără a accesa datele brute.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Eye className="w-6 h-6 text-orange-600 mt-1" />
              <div>
                <div className="text-sm font-medium text-orange-800">
                  Verificabilitate publică
                </div>
                <p className="text-xs text-gray-600">
                  Oricine poate verifica corectitudinea fără a compromite votul.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VotingProcess;
