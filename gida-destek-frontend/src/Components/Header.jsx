import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
/*
const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">Gıda Destek</Link>
        <nav className="nav">
          <ul>
            <li><Link to="/">Ana Sayfa</Link></li>
            <li><Link to="/foods">Gıdalar</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
*/
const Header = () => {
  return (
    <div className="bg-gray-100 font-sans">
      {/* Ana Başlık */}
      <header className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-800 animate__animated animate__fadeInUp">
          Gıda Kurtaran Uygulaması
        </h1>
      </header>

      {/* Buton */}
      <div className="flex justify-center my-8">
        <button className="bg-blue-500 text-white px-6 py-3 rounded-lg transform transition-all duration-300 hover:bg-blue-600 hover:scale-105">
          Gıda Kurtar
        </button>
      </div>

      {/* Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-6 py-8">
        <div className="bg-white shadow-lg rounded-lg p-4 animate__animated animate__fadeInUp">
          <h2 className="text-xl font-semibold text-gray-700">Kurtarılan Gıda 1</h2>
          <p className="text-gray-600">Açıklama buraya gelecek...</p>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-4 animate__animated animate__fadeInUp">
          <h2 className="text-xl font-semibold text-gray-700">Kurtarılan Gıda 2</h2>
          <p className="text-gray-600">Açıklama buraya gelecek...</p>
        </div>
        <div className="bg-white shadow-lg rounded-lg p-4 animate__animated animate__fadeInUp">
          <h2 className="text-xl font-semibold text-gray-700">Kurtarılan Gıda 3</h2>
          <p className="text-gray-600">Açıklama buraya gelecek...</p>
        </div>
      </div>

      {/* Scroll ile Gelen Öğeler */}
      <div className="opacity-0 transform translate-y-10 transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:translate-y-0 mx-6">
        <div className="bg-green-200 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-green-800">Yardımcı Olun</h2>
          <p className="text-green-600">
            Gıda bağışı yaparak kurtarılacak yiyeceklerin miktarını artırabilirsiniz.
          </p>
        </div>
      </div>

      {/* Loading Spinner */}
      <div className="w-16 h-16 border-t-4 border-blue-500 rounded-full animate-spin mx-auto mt-8"></div>
    </div>
  );
};

export default Header;