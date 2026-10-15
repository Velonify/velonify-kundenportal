import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ToastBereich } from './components/Toast';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastBereich>
      <App />
    </ToastBereich>
  </StrictMode>,
);
