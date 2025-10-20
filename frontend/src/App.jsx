import { useState } from 'react'
import { LPForm } from './components/LPForm'
import { Results } from './pages/Results'
import { useLPStore } from './store'
import { getLast, deleteLast } from './services/api'
import { MdClose, MdDelete } from 'react-icons/md'

export function App() {
  const { result, setRequest, setResult } = useLPStore()
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showLastOperations, setShowLastOperations] = useState(false)
  const [lastOperations, setLastOperations] = useState([])

  const loadLastOperations = async () => {
    setLoading(true)
    try {
      const data = await getLast()
      if (data.items && data.items.length > 0) {
        setLastOperations(data.items)
        setShowLastOperations(true)
      }
    } catch (error) {
      console.error('Error loading last operations:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectOperation = (operation) => {
    setRequest(operation.request)
    setResult(operation.response)
    setShowResults(true)
    setShowLastOperations(false)
  }

  const handleDeleteOperation = async (index) => {
    try {
      console.log('Deleting operation at index:', index)
      await deleteLast(index)
      // Refresh the list
      const data = await getLast()
      console.log('Updated operations list:', data.items)
      setLastOperations(data.items)
    } catch (error) {
      console.error('Error deleting operation:', error)
    }
  }

  return (
    <div className="container">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ 
          fontFamily: 'Lexend, sans-serif', 
          color: '#181818',
          margin: 0
        }}>
          Simplex Solver
        </h1>
        <button 
          onClick={loadLastOperations}
          disabled={loading}
          style={{
            background: '#9bb560',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'Lexend, sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 8px rgba(155, 181, 96, 0.3)',
            transition: 'all 0.2s ease',
            opacity: loading ? 0.7 : 1
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.background = '#8aa550'
              e.target.style.transform = 'translateY(-2px)'
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.target.style.background = '#9bb560'
              e.target.style.transform = 'translateY(0)'
            }
          }}
        >
          {loading ? 'Cargando...' : 'Cargar Últimas'}
        </button>
      </div>
      
      {/* Last Operations Modal */}
      {showLastOperations && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            border: '2px solid #4e6e5d',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            fontFamily: 'Lexend, sans-serif'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontFamily: 'Lexend, sans-serif',
                color: '#181818',
                margin: 0,
                fontSize: '20px',
                fontWeight: '600'
              }}>
                Últimas Operaciones ({lastOperations.length})
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowLastOperations(false)}
                  style={{
                    background: '#6c757d',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: 'Lexend, sans-serif',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <MdClose />
                </button>
              </div>
            </div>
            
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {lastOperations.slice(0, Math.max(3, lastOperations.length)).map((operation, index) => (
                <div
                  key={index}
                  onClick={() => selectOperation(operation)}
                  style={{
                    background: '#f8f9fa',
                    border: '1px solid #4e6e5d',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#e9ecef'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#f8f9fa'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      background: '#9bb560',
                      color: '#181818',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      fontFamily: 'Lexend, sans-serif'
                    }}>
                      Operación #{index + 1}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{
                        background: '#4e6e5d',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        fontFamily: 'Lexend, sans-serif'
                      }}>
                        {operation.request?.objective?.sense === 'max' ? 'Maximizar' : 'Minimizar'}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteOperation(index)
                        }}
                        style={{
                          background: '#fa8072',
                          color: '#ffffff',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          fontFamily: 'Lexend, sans-serif',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '13px', color: '#181818', marginBottom: '8px' }}>
                    <strong>Variables:</strong> {operation.request?.objective?.coefficients?.length || 0} | 
                    <strong> Restricciones:</strong> {operation.request?.constraints?.length || 0}
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    Función objetivo: {operation.request?.objective?.coefficients?.map(c => c.toString()).join('x + ') || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <LPForm onSolved={() => setShowResults(true)} />
      {showResults && result && <Results />}
    </div>
  )
}
