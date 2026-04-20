import React, { useState } from 'react';
import { financeTermsData } from '../data/financeTerms'; // Adjust path if needed

const GlossaryPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  // Logic to filter the list based on search AND the selected tab
  const filteredTerms = financeTermsData.filter((item) => {
    const matchesSearch = item.term.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "All" || item.cat === activeTab;
    return matchesSearch && matchesTab;
  });

  const categories = ["All", "Investment", "Business", "Banking", "Finance", "Personal Finance"];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#2c3e50' }}>Financial Glossary</h2>
      <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Finance terms explained in plain English.</p>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search for a term (e.g. 'Stock')..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          marginBottom: '20px',
          fontSize: '16px'
        }}
      />

      {/* Category Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === cat ? '#3498db' : '#ecf0f1',
              color: activeTab === cat ? 'white' : '#2c3e50',
              fontWeight: 'bold',
              transition: '0.3s'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {filteredTerms.length > 0 ? (
          filteredTerms.map((item, index) => (
            <div key={index} style={{
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderLeft: '5px solid #3498db'
            }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{item.term}</h3>
              <p style={{ margin: '0', color: '#555', lineHeight: '1.5' }}>{item.def}</p>
              <small style={{ color: '#95a5a6', fontStyle: 'italic' }}>Category: {item.cat}</small>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: '#e74c3c' }}>No terms found. Try a different search!</p>
        )}
      </div>
    </div>
  );
};

export default GlossaryPage;