import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRoutes } from './routes/AppRoutes';
import { ThemeSettingsModal } from './components/theme/ThemeSettingsModal';
import { CinematicBackground } from './components/theme/CinematicBackground';

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CinematicBackground />
          <AppRoutes />
          <ThemeSettingsModal />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
