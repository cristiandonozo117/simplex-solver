import { useState, useEffect } from 'react'
import { useLPStore } from '../store'
import { solveSimplex } from '../services/api'

const SIGNS = ['=', '<=', '>=']

// Helper function to validate and convert to positive integer
function validatePositiveInteger(value) {
  // Remove any non-digit characters except for the first character if it's a digit
  const cleaned = value.replace(/[^0-9]/g, '')
  // Convert to number and ensure it's a positive integer
  const num = parseInt(cleaned, 10)
  return isNaN(num) || num <= 0 ? 1 : num
}

// Helper function to clean and validate numeric input (allows partial values)
function cleanNumericInput(value) {
  // Remove any non-numeric characters except minus and decimal point
  let cleaned = value.replace(/[^0-9.-]/g, '')
  
  // Handle minus sign - only allow at the beginning
  if (cleaned.includes('-')) {
    const minusIndex = cleaned.indexOf('-')
    if (minusIndex !== 0) {
      // Remove minus if not at start
      cleaned = cleaned.replace(/-/g, '')
    } else if ((cleaned.match(/-/g) || []).length > 1) {
      // Keep only first minus
      cleaned = '-' + cleaned.replace(/-/g, '')
    }
  }
  
  // Handle decimal point - only allow one
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('')
  }
  
  return cleaned
}

// Helper function to convert to number (for final validation)
function parseNumericValue(value) {
  if (!value || value === '-' || value === '.' || value === '-.') {
    return 0
  }
  const num = parseFloat(value)
  return isNaN(num) ? 0 : num
}

export function LPForm({ onSolved }) {
  const { setRequest, setResult, request } = useLPStore()
  const [numVars, setNumVars] = useState(2)
  const [numCons, setNumCons] = useState(2)
  const [sense, setSense] = useState('max')
  const [coefs, setCoefs] = useState(['0', '0'])
  const [constraints, setConstraints] = useState([
    { coefficients: ['0', '0'], sign: '<=', rhs: '0' },
    { coefficients: ['0', '0'], sign: '<=', rhs: '0' },
  ])

  // Effect to populate form when a request is loaded from cache
  useEffect(() => {
    if (request) {
      // Set number of variables and constraints
      const numVariables = request.objective?.coefficients?.length || 2
      const numConstraints = request.constraints?.length || 2
      
      setNumVars(numVariables)
      setNumCons(numConstraints)
      setSense(request.objective?.sense || 'max')
      
      // Set objective coefficients (convert to strings for display)
      setCoefs((request.objective?.coefficients || [0, 0]).map(v => String(v)))
      
      // Set constraints (convert to strings for display)
      setConstraints((request.constraints?.map(c => ({
        coefficients: (c.coefficients || []).map(v => String(v)),
        sign: c.sign || '<=',
        rhs: String(c.rhs || 0)
      })) || [
        { coefficients: ['0', '0'], sign: '<=', rhs: '0' },
        { coefficients: ['0', '0'], sign: '<=', rhs: '0' },
      ]))
    }
  }, [request])

  function updateNumVars(n) {
    const m = validatePositiveInteger(n)
    setNumVars(m)
    setCoefs((prev) => {
      const arr = [...prev]
      while (arr.length < m) arr.push('0')
      while (arr.length > m) arr.pop()
      return arr
    })
    setConstraints((prev) => prev.map((c) => ({
      ...c,
      coefficients: [
        ...c.coefficients.slice(0, m),
        ...Array(Math.max(0, m - c.coefficients.length)).fill('0'),
      ],
    })))
  }

  function updateNumCons(n) {
    const k = validatePositiveInteger(n)
    setNumCons(k)
    setConstraints((prev) => {
      const arr = [...prev]
      while (arr.length < k) arr.push({ coefficients: Array(numVars).fill('0'), sign: '<=', rhs: '0' })
      while (arr.length > k) arr.pop()
      return arr
    })
  }

  function clearForm() {
    setNumVars(2)
    setNumCons(2)
    setSense('max')
    setCoefs(['0', '0'])
    setConstraints([
      { coefficients: ['0', '0'], sign: '<=', rhs: '0' },
      { coefficients: ['0', '0'], sign: '<=', rhs: '0' },
    ])
    setRequest(null)
    setResult(null)
  }

  async function onSubmit(e) {
    e.preventDefault()
    // Ensure all values are numbers before submitting
    const payload = {
      objective: { 
        coefficients: coefs.map(v => parseNumericValue(String(v))), 
        sense 
      },
      constraints: constraints.map((c) => ({
        coefficients: c.coefficients.map(v => parseNumericValue(String(v))),
        sign: c.sign,
        rhs: parseNumericValue(String(c.rhs)),
      })),
      variable_names: Array.from({ length: numVars }, (_, i) => `x${i + 1}`),
    }
    setRequest(payload)
    const result = await solveSimplex(payload)
    setResult(result)
    onSolved?.()
  }

  return (
    <section style={{
      background: '#ffffff',
      border: '2px solid #4e6e5d',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      fontFamily: 'Lexend, sans-serif'
    }}>
      <h2 style={{ 
        fontFamily: 'Lexend, sans-serif', 
        color: '#181818',
        marginBottom: '20px',
        fontSize: '24px',
        fontWeight: '700'
      }}>
        Definición del problema
      </h2>
      
      <form onSubmit={onSubmit}>
        {/* Configuration Row */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          marginBottom: '20px',
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #4e6e5d'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', color: '#181818' }}>Variables (n):</label>
            <input 
              type="number" 
              min={1} 
              step={1}
              value={numVars} 
              onChange={(e) => updateNumVars(e.target.value)}
              onKeyDown={(e) => {
                // Prevent decimal point, minus sign, and 'e' (scientific notation)
                if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault()
                }
              }}
              onInput={(e) => {
                // Remove any decimal places if somehow entered
                if (e.target.value.includes('.')) {
                  e.target.value = e.target.value.split('.')[0]
                }
              }}
              style={{
                width: '60px',
                padding: '6px 8px',
                border: '1px solid #4e6e5d',
                borderRadius: '4px',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', color: '#181818' }}>Restricciones (m):</label>
            <input 
              type="number" 
              min={0} 
              step={1}
              value={numCons} 
              onChange={(e) => updateNumCons(e.target.value)}
              onKeyDown={(e) => {
                // Prevent decimal point, minus sign, and 'e' (scientific notation)
                if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault()
                }
              }}
              onInput={(e) => {
                // Remove any decimal places if somehow entered
                if (e.target.value.includes('.')) {
                  e.target.value = e.target.value.split('.')[0]
                }
              }}
              style={{
                width: '60px',
                padding: '6px 8px',
                border: '1px solid #4e6e5d',
                borderRadius: '4px',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: '600', color: '#181818' }}>Tipo:</label>
            <select 
              value={sense} 
              onChange={(e) => setSense(e.target.value)}
              style={{
                padding: '6px 8px',
                border: '1px solid #4e6e5d',
                borderRadius: '4px',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '14px',
                background: '#ffffff'
              }}
            >
              <option value="max">Maximizar</option>
              <option value="min">Minimizar</option>
            </select>
          </div>
        </div>

        {/* Objective Function */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            fontFamily: 'Lexend, sans-serif', 
            color: '#181818',
            marginBottom: '12px',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Función objetivo:
          </h3>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #4e6e5d'
          }}>
            {Array.from({ length: numVars }).map((_, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="text"
                  value={coefs[j]}
                  onChange={(e) => {
                    const cleaned = cleanNumericInput(e.target.value)
                    setCoefs((prev) => prev.map((v, idx) => (idx === j ? cleaned : v)))
                  }}
                  onBlur={(e) => {
                    // Convert to number when field loses focus
                    const numValue = parseNumericValue(e.target.value)
                    setCoefs((prev) => prev.map((v, idx) => (idx === j ? numValue : v)))
                  }}
                  onKeyDown={(e) => {
                    // Allow navigation and editing keys
                    if ([8, 9, 27, 13, 37, 38, 39, 40, 46].indexOf(e.keyCode) !== -1 ||
                        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                        (e.ctrlKey && [65, 67, 86, 88, 90].indexOf(e.keyCode) !== -1)) {
                      return;
                    }
                    // Allow minus only at the beginning or when replacing
                    if ((e.keyCode === 189 || e.keyCode === 109) && 
                        (e.target.selectionStart === 0 || e.target.selectionEnd === e.target.value.length)) {
                      return;
                    }
                    // Allow decimal point if not already present
                    if ((e.keyCode === 190 || e.keyCode === 110) && !e.target.value.includes('.')) {
                      return;
                    }
                    // Allow numbers (0-9 on main keyboard and numpad)
                    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
                      return;
                    }
                    // Block everything else
                    e.preventDefault();
                  }}
                  style={{
                    width: '60px',
                    padding: '6px 8px',
                    border: '1px solid #4e6e5d',
                    borderRadius: '4px',
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '14px',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    background: '#ffffff'
                  }}
                />
                <span style={{ fontWeight: '600', color: '#181818' }}>
                  x{j + 1}{j < numVars - 1 ? ' +' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Constraints */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            fontFamily: 'Lexend, sans-serif', 
            color: '#181818',
            marginBottom: '12px',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Restricciones:
          </h3>
          {Array.from({ length: numCons }).map((_, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              gap: '8px', 
              alignItems: 'center', 
              flexWrap: 'wrap',
              marginBottom: '12px',
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #4e6e5d'
            }}>
              {Array.from({ length: numVars }).map((_, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="text"
                    value={constraints[i]?.coefficients[j] ?? '0'}
                    onChange={(e) => {
                      const cleaned = cleanNumericInput(e.target.value)
                      setConstraints((prev) => prev.map((c, idx) => idx === i ? {
                        ...c,
                        coefficients: c.coefficients.map((v, jj) => jj === j ? cleaned : v),
                      } : c))
                    }}
                    onBlur={(e) => {
                      // Convert to number when field loses focus
                      const numValue = parseNumericValue(e.target.value)
                      setConstraints((prev) => prev.map((c, idx) => idx === i ? {
                        ...c,
                        coefficients: c.coefficients.map((v, jj) => jj === j ? numValue : v),
                      } : c))
                    }}
                    onKeyDown={(e) => {
                      // Allow navigation and editing keys
                      if ([8, 9, 27, 13, 37, 38, 39, 40, 46].indexOf(e.keyCode) !== -1 ||
                          // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                          (e.ctrlKey && [65, 67, 86, 88, 90].indexOf(e.keyCode) !== -1)) {
                        return;
                      }
                      // Allow minus only at the beginning or when replacing
                      if ((e.keyCode === 189 || e.keyCode === 109) && 
                          (e.target.selectionStart === 0 || e.target.selectionEnd === e.target.value.length)) {
                        return;
                      }
                      // Allow decimal point if not already present
                      if ((e.keyCode === 190 || e.keyCode === 110) && !e.target.value.includes('.')) {
                        return;
                      }
                      // Allow numbers (0-9 on main keyboard and numpad)
                      if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
                        return;
                      }
                      // Block everything else
                      e.preventDefault();
                    }}
                    style={{
                      width: '60px',
                      padding: '6px 8px',
                      border: '1px solid #4e6e5d',
                      borderRadius: '4px',
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '14px',
                      textAlign: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      background: '#ffffff'
                    }}
                  />
                  <span style={{ fontWeight: '600', color: '#181818' }}>
                    x{j + 1}{j < numVars - 1 ? ' +' : ''}
                  </span>
                </div>
              ))}
              <select 
                value={constraints[i]?.sign ?? '<='} 
                onChange={(e) => setConstraints((prev) => prev.map((c, idx) => idx === i ? { ...c, sign: e.target.value } : c))}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #4e6e5d',
                  borderRadius: '4px',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '14px',
                  background: '#ffffff'
                }}
              >
                {SIGNS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input 
                type="text" 
                value={constraints[i]?.rhs ?? '0'} 
                onChange={(e) => {
                  const cleaned = cleanNumericInput(e.target.value)
                  setConstraints((prev) => prev.map((c, idx) => idx === i ? { ...c, rhs: cleaned } : c))
                }}
                onBlur={(e) => {
                  // Convert to number when field loses focus
                  const numValue = parseNumericValue(e.target.value)
                  setConstraints((prev) => prev.map((c, idx) => idx === i ? { ...c, rhs: numValue } : c))
                }}
                onKeyDown={(e) => {
                  // Allow navigation and editing keys
                  if ([8, 9, 27, 13, 37, 38, 39, 40, 46].indexOf(e.keyCode) !== -1 ||
                      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                      (e.ctrlKey && [65, 67, 86, 88, 90].indexOf(e.keyCode) !== -1)) {
                    return;
                  }
                  // Allow minus only at the beginning or when replacing
                  if ((e.keyCode === 189 || e.keyCode === 109) && 
                      (e.target.selectionStart === 0 || e.target.selectionEnd === e.target.value.length)) {
                    return;
                  }
                  // Allow decimal point if not already present
                  if ((e.keyCode === 190 || e.keyCode === 110) && !e.target.value.includes('.')) {
                    return;
                  }
                  // Allow numbers (0-9 on main keyboard and numpad)
                  if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
                    return;
                  }
                  // Block everything else
                  e.preventDefault();
                }}
                style={{
                  width: '60px',
                  padding: '6px 8px',
                  border: '1px solid #4e6e5d',
                  borderRadius: '4px',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '14px',
                  textAlign: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  background: '#ffffff'
                }}
              />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center',
          marginTop: '20px'
        }}>
          <button 
            type="submit"
            style={{
              background: '#9bb560',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: 'Lexend, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(155, 181, 96, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#8aa550'
              e.target.style.transform = 'translateY(-2px)'
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#9bb560'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            Resolver
          </button>
          <button 
            type="button"
            onClick={clearForm}
            style={{
              background: '#6c757d',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: 'Lexend, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(108, 117, 125, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#5a6268'
              e.target.style.transform = 'translateY(-2px)'
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#6c757d'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            Limpiar
          </button>
        </div>
      </form>
    </section>
  )
}