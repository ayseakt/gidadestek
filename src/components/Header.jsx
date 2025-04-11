import React from 'react';
import { Link } from 'react-router-dom';
import './header.css';

function Header() {
  return (
    <header className="app-header">
      <div className="container">
        <div className="logo">
          <h1>Gıda Destek</h1>
        </div>
        <nav className="main-nav">
          <ul>
            <li><a href="/">Ana Sayfa</a></li>
            <li><a href="/foods">Yemekler</a></li>
            <li><a href="/about">Hakkımızda</a></li>
          </ul>
        </nav>
        <div className="user-actions">
          <button className="btn login">Giriş Yap</button>
          <button className="btn signup">Kayıt Ol</button>
        </div>
      </div>
    </header>
  );
}

export default Header;