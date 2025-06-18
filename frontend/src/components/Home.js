import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PollMaster
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Platforma modernă pentru crearea și gestionarea sondajelor online. 
            
          </p>
          
          {user ? (
            <div className="space-y-4">
              <p className="text-lg text-green-700 font-semibold">
                Bună, {user.username}! Bine ai revenit!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/polls"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Vezi Sondajele
                </Link>
                {/* ✅ FIX: Toți utilizatorii autentificați văd sondajele securizate */}
                <Link
                  to="/secure-polls"
                  className="bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg"
                >
                  Sondaje Securizate
                </Link>
                <Link
                  to="/profile"
                  className="bg-gray-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-700 transition-colors shadow-lg"
                >
                  Profilul Meu
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Începe Acum
              </Link>
              <Link
                to="/login"
                className="bg-gray-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-700 transition-colors shadow-lg"
              >
                Autentificare
              </Link>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Sondaje Clasice</h3>
            <p className="text-gray-600">
              Creează sondaje simple și eficiente pentru comunitatea ta. 
              Interfață intuitivă și rezultate în timp real.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Sondaje Securizate</h3>
            <p className="text-gray-600">
              Criptare homomorfă pentru voturi anonime și sigure.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Accesibil Oriunde</h3>
            <p className="text-gray-600">
              Platformă responsive care funcționează perfect pe desktop, 
              tabletă și telefon mobil.
            </p>
          </div>
        </div>

        {/* Statistics Section */}
        {/* <div className="bg-white rounded-xl p-8 shadow-lg mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Statistici Platformă
          </h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">1000+</div>
              <div className="text-gray-600">Sondaje Create</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">5000+</div>
              <div className="text-gray-600">Voturi Înregistrate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">200+</div>
              <div className="text-gray-600">Utilizatori Activi</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div> */}

        {/* How It Works Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Cum Funcționează
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Creează Contul</h3>
              <p className="text-gray-600">
                Înregistrează-te rapid și gratuit cu doar câteva clickuri.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Creează Sondajul</h3>
              <p className="text-gray-600">
                Adaugă întrebarea și opțiunile de răspuns în câteva minute.
                <br />
                <small className="text-gray-500">
                  *Sondajele securizate pot fi create doar de administratori
                </small>
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Partajează & Votează</h3>
              <p className="text-gray-600">
                Distribuie link-ul și urmărește rezultatele în timp real.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {/* <div className="text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            Gata să Începi?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Alătură-te comunității noastre și începe să creezi sondaje profesionale astăzi!
          </p>
          
          {!user && (
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-lg text-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg transform hover:scale-105"
              >
                Înregistrează-te Gratuit
              </Link>
              <Link
                to="/polls"
                className="bg-gray-600 text-white px-10 py-4 rounded-lg text-xl font-bold hover:bg-gray-700 transition-colors shadow-lg"
              >
                Explorează Sondajele
              </Link>
            </div>
          )}
        </div> */}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">PollMaster</h3>
              <p className="text-gray-400">
                Platforma ta de încredere pentru sondaje online sigure și eficiente.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Funcționalități</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Sondaje Clasice</li>
                <li>Sondaje Securizate</li>
                <li>Design Responsive</li>
                <li>Statistici Avansate</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Securitate</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Criptare Paillier</li>
                <li>Semnături Oarbe RSA</li>
                <li>Verificare Integritate</li>
                <li>Protecția Datelor</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suport</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Contact</li>
                <li>FAQ</li>
                <li>Documentație</li>
                <li>Suport Tehnic</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PollMaster. Lucrare pentru licență.</p>
            <p className="mt-2">Dezvoltat de Luca Stefan</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;