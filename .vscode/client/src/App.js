import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Game from './pages/Game';
import Home from './pages/Home'; // Example home component

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} /> {/* Ensure you have a route for "/" */}
        <Route path="/game" element={<Game />} />
        {/* Add other routes here */}
      </Routes>
    </Router>
  );
};

export default App;
