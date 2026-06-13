import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@wizkidz/design-system/tokens.css';
import '@wizkidz/design-system/themes/light.css';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
