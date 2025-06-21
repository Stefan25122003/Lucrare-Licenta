import React, { useState, useEffect } from 'react';
import { User, Server, Shield, Lock, Key, Eye, CheckCircle, BarChart3, FileText, ArrowRight, ArrowDown, Database, Cpu, Globe } from 'lucide-react';

const VotingProcess = () => {
  const [selectedStep, setSelectedStep] = useState(null);
  const [viewMode, setViewMode] = useState('overview');
  const [isVertical, setIsVertical] = useState(false);

  // Detectare responsive pentru layout
  useEffect(() => {
    const checkSize = () => {
      setIsVertical(window.innerWidth < 768); // md breakpoint
    };
    
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const steps = [
    {
      id: 1,
      title: "Inițializare",
      subtitle: "Accesare sistem",
      icon: User,
      color: "blue",
      position: isVertical ? { x: 50, y: 10 } : { x: 10, y: 20 },
      technical: "Browser generează keypair RSA local pentru blind signing",
      details: "Utilizatorul accesează interfața de votare securizată"
    },
    {
      id: 2,
      title: "Blind Signing",
      subtitle: "Token anonim",
      icon: Shield,
      color: "purple",
      position: isVertical ? { x: 50, y: 25 } : { x: 26, y: 20 },
      technical: "message × r^e mod n → Server semnează → signature / r mod n",
      details: "Browser-ul generează un token anonim prin RSA blind signing"
    },
    {
      id: 3,
      title: "Criptare Paillier",
      subtitle: "Vector one-hot",
      icon: Lock,
      color: "green",
      position: isVertical ? { x: 50, y: 40 } : { x: 42, y: 20 },
      technical: "c = g^m × r^n mod n² pentru fiecare opțiune",
      details: "Votul este criptat homomorphic pentru a permite tallying secret"
    },
    {
      id: 4,
      title: "ZK Proofs",
      subtitle: "Dovezi valide",
      icon: Eye,
      color: "orange",
      position: isVertical ? { x: 50, y: 55 } : { x: 58, y: 20 },
      technical: "Sigma protocols: commitment, challenge, response",
      details: "Dovedește că votul este valid fără să-l dezvăluie"
    },
    {
      id: 5,
      title: "Transmitere",
      subtitle: "Submit securizat",
      icon: ArrowRight,
      color: "red",
      position: isVertical ? { x: 50, y: 70 } : { x: 74, y: 20 },
      technical: "{ciphertext, zkproof, blind_signature} → Server",
      details: "Pachetul complet este trimis către server pentru procesare"
    },
    {
      id: 6,
      title: "Tallying",
      subtitle: "Rezultate finale",
      icon: BarChart3,
      color: "indigo",
      position: isVertical ? { x: 50, y: 85 } : { x: 90, y: 20 },
      technical: "∏ ciphertext_i = Encrypt(∑ votes_i) → Decrypt rezultat",
      details: "Server calculează rezultatele prin multiplicarea ciphertexturilor"
    }
  ];

  const connections = [
    { from: 1, to: 2, label: "Request token" },
    { from: 2, to: 3, label: "Signed token" },
    { from: 3, to: 4, label: "Encrypted vote" },
    { from: 4, to: 5, label: "Valid proof" },
    { from: 5, to: 6, label: "Store & tally" }
  ];

  const colorClasses = {
    blue: "from-blue-400 to-blue-600",
    purple: "from-purple-400 to-purple-600",
    green: "from-green-400 to-green-600",
    orange: "from-orange-400 to-orange-600",
    red: "from-red-400 to-red-600",
    indigo: "from-indigo-400 to-indigo-600"
  };

  const StepNode = ({ step, isSelected, onClick }) => {
    const Icon = step.icon;
    return (
      <div
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
          isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
        }`}
        style={{ left: `${step.position.x}%`, top: `${step.position.y}%` }}
        onClick={() => onClick(step.id)}
      >
        <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center shadow-lg">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="mt-1 text-center">
          <div className="font-bold text-xs text-gray-500">{step.title}</div>
          <div className="text-[10px] text-gray-400">{step.subtitle}</div>
        </div>
        {isSelected && (
          <div className={`absolute ${
            isVertical 
              ? 'left-full ml-4 top-0' 
              : 'top-full mt-4 left-1/2 transform -translate-x-1/2'
          } bg-white rounded-lg shadow-xl p-4 w-64 border z-30`}>
            <h4 className="font-bold text-gray-800 mb-2">{step.title}</h4>
            <p className="text-sm text-gray-600 mb-3">{step.details}</p>
            {viewMode === 'technical' && (
              <div className="bg-gray-100 rounded p-2">
                <code className="text-xs text-gray-800">{step.technical}</code>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const ConnectionArrow = ({ connection }) => {
    const fromStep = steps.find(s => s.id === connection.from);
    const toStep   = steps.find(s => s.id === connection.to);
    if (!fromStep || !toStep) return null;

    const deltaX = toStep.position.x - fromStep.position.x;
    const deltaY = toStep.position.y - fromStep.position.y;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // calc angle in degrees
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

    return (
      <div
        className="absolute z-0"
        style={{
          // start at the exact center of the “from” node
          left:      `${fromStep.position.x}%`,
          top:       `${fromStep.position.y}%`,
          width:     `${length}%`,
          // translate Y by -50% to center line vertically on the node
          transform: `translate(0, -50%) rotate(${angle}deg)`,
          // origin at the left-center so line extends from the node’s middle
          transformOrigin: '0 50%'
        }}
      >
        <div className="relative h-[1px] bg-gray-400 w-full">
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
            <ArrowRight className="w-3 h-3 text-gray-400" />
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-0.5">
            <span className="text-[9px] text-gray-500 bg-white px-0.5 rounded whitespace-nowrap">
              {connection.label}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const ArchitectureDiagram = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg h-full">
      <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Arhitectura Sistemului</h3>
      
      {/* Client Side */}
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gray-700 rounded-lg p-4 shadow-lg">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <span className="ml-3 font-bold text-gray-800">Client Browser</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 text-center border-2 border-blue-200">
            <User className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-xs font-semibold">User Interface</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center border-2 border-purple-200">
            <Key className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-xs font-semibold">RSA Keygen</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center border-2 border-green-200">
            <Lock className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-xs font-semibold">Paillier Encrypt</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center border-2 border-orange-200">
            <Eye className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <div className="text-xs font-semibold">ZK Proofs</div>
          </div>
        </div>
      </div>

      {/* Network */}
      <div className="flex justify-center mb-4">
        <div className="flex items-center space-x-2">
          <ArrowDown className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-600">Secure Channel (TLS)</span>
          <ArrowDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Server Side */}
      <div>
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gray-700 rounded-lg p-4 shadow-lg">
            <Server className="w-8 h-8 text-white" />
          </div>
          <span className="ml-3 font-bold text-gray-800">Voting Server</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 rounded-lg p-3 text-center border-2 border-red-200">
            <Shield className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <div className="text-xs font-semibold">Blind Signing</div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3 text-center border-2 border-indigo-200">
            <Database className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
            <div className="text-xs font-semibold">Vote Storage</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center border-2 border-purple-200">
            <Cpu className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-xs font-semibold">Homomorphic Tally</div>
          </div>
        </div>
      </div>
    </div>
  );

  const CryptographicFlow = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg h-full">
      <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Fluxul Criptografic</h3>
      
      <div className="space-y-6">
        {/* Step 1: RSA Blind Signing */}
        <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
          <h4 className="font-bold text-purple-700 mb-2">1. RSA Blind Signing</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Client:</strong> <code>blinded = hash(token) × r^e mod n</code></div>
            <div><strong>Server:</strong> <code>signature = blinded^d mod n</code></div>
            <div><strong>Client:</strong> <code>unblinded = signature / r mod n</code></div>
          </div>
        </div>

        {/* Step 2: Paillier Encryption */}
        <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
          <h4 className="font-bold text-green-700 mb-2">2. Paillier Homomorphic Encryption</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Vector:</strong> <code>[1, 0] pentru Opțiunea A</code></div>
            <div><strong>Encrypt:</strong> <code>c₁ = g^1 × r₁^n mod n²</code></div>
            <div><strong>Encrypt:</strong> <code>c₂ = g^0 × r₂^n mod n²</code></div>
          </div>
        </div>

        {/* Step 3: Zero Knowledge Proofs */}
        <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
          <h4 className="font-bold text-orange-700 mb-2">3. Zero-Knowledge Proofs</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Prove:</strong> Ciphertext conține un vot valid (0 sau 1)</div>
            <div><strong>Prove:</strong> Suma voturilor = 1 (exact o opțiune)</div>
            <div><strong>Protocol:</strong> Sigma protocols cu Fiat-Shamir</div>
          </div>
        </div>

        {/* Step 4: Homomorphic Tallying */}
        <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-500">
          <h4 className="font-bold text-indigo-700 mb-2">4. Homomorphic Tallying</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Multiply:</strong> <code>∏ᵢ c₁ᵢ = Encrypt(∑ᵢ vote₁ᵢ)</code></div>
            <div><strong>Multiply:</strong> <code>∏ᵢ c₂ᵢ = Encrypt(∑ᵢ vote₂ᵢ)</code></div>
            <div><strong>Decrypt:</strong> Rezultate finale pentru fiecare opțiune</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sistem de Votare Securizată
          </h1>
          <p className="text-base md:text-lg text-gray-600 mb-6">
            Diagramă comprehensivă a fluxului de votare cu blind signing, criptare homomorphic și zero-knowledge proofs
          </p>
          
          {/* View Mode Selector */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-6">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors text-sm md:text-base ${
                viewMode === 'overview' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Vizualizare Generală
            </button>
            <button
              onClick={() => setViewMode('technical')}
              className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors text-sm md:text-base ${
                viewMode === 'technical' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Detalii Tehnice
            </button>
            <button
              onClick={() => setViewMode('architecture')}
              className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors text-sm md:text-base ${
                viewMode === 'architecture' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Arhitectură
            </button>
          </div>
        </div>

        {viewMode === 'architecture' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[800px]">
            <ArchitectureDiagram />
            <CryptographicFlow />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Flow Diagram */}
            <div className="xl:col-span-2 bg-white rounded-xl shadow-lg p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 text-center">
                Fluxul Principal de Votare
              </h2>
              
              <div className={`relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl ${
                isVertical ? 'h-[600px]' : 'h-80 md:h-96'
              }`}>
                {/* Render connections first (behind nodes) */}
                {connections.map((connection, index) => (
                  <ConnectionArrow key={index} connection={connection} />
                ))}

                {/* Render step nodes */}
                {steps.map((step) => (
                  <StepNode
                    key={step.id}
                    step={step}
                    isSelected={selectedStep === step.id}
                    onClick={setSelectedStep}
                  />
                ))}
              </div>
            </div>

            {/* Security Features Panel */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold text-black mb-4">
                Caracteristici de Securitate
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                  <Shield className="w-5 h-5 text-green-600 mt-1 mr-2" />
                  <div>
                    <div className="font-semibold text-green-700 text-sm">Anonimitate</div>
                    <p className="text-xs text-green-600 mt-1">
                      RSA blind signing ascunde identitatea votantului de server
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
                  <Lock className="w-5 h-5 text-blue-600 mt-1 mr-2" />
                  <div>
                    <div className="font-semibold text-blue-700 text-sm">Confidențialitate</div>
                    <p className="text-xs text-blue-600 mt-1">
                      Criptarea Paillier permite tallying fără decriptare individuală
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start bg-orange-50 rounded-lg p-3 border-l-4 border-orange-500">
                  <CheckCircle className="w-5 h-5 text-orange-600 mt-1 mr-2" />
                  <div>
                    <div className="font-semibold text-orange-700 text-sm">Integritate</div>
                    <p className="text-xs text-orange-600 mt-1">
                      Zero-knowledge proofs garantează validitatea voturilor
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start bg-purple-50 rounded-lg p-3 border-l-4 border-purple-500">
                  <Eye className="w-5 h-5 text-purple-600 mt-1 mr-2" />
                  <div>
                    <div className="font-semibold text-purple-700 text-sm">Verificabilitate</div>
                    <p className="text-xs text-purple-600 mt-1">
                      Dovezile pot fi verificate independent de oricine
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Properties */}
              {viewMode === 'technical' && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-semibold text-gray-700 mb-3">Proprietăți Matematice</h4>
                  <div className="space-y-2 text-xs">
                    <div className="bg-gray-100 rounded p-2">
                      <strong>Homomorphism:</strong><br/>
                      <code>E(a) × E(b) = E(a + b)</code>
                    </div>
                    <div className="bg-gray-100 rounded p-2">
                      <strong>Zero-Knowledge:</strong><br/>
                      <code>Prove(x): Verify(proof) ∧ ¬Know(x)</code>
                    </div>
                    <div className="bg-gray-100 rounded p-2">
                      <strong>Blind Signature:</strong><br/>
                      <code>Sign(m × r^e) / r = Sign(m)</code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingProcess;