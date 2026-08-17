import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';
import Sidebar from './components/layout/Sidebar';

function App() {
    return (
        <AuthProvider> {/* ✅ AuthProvider wraps everything */}
            <Router>
                <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
                    <Sidebar />
                    <div className="flex-1 flex flex-col overflow-y-auto">
                        <AppRouter />
                    </div>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;