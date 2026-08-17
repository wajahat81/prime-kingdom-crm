import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8">
            <div className="text-center max-w-2xl">
                <h1 className="text-5xl font-bold mb-4">
                    🏰 Prime Kingdom CRM
                </h1>
                <p className="text-xl mb-8">
                    Your all-in-one Customer Relationship Management system
                </p>
                <div className="flex gap-4 justify-center">
                    <Link 
                        to="/login" 
                        className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                        Login
                    </Link>
                    <Link 
                        to="/dashboard" 
                        className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
                    >
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;