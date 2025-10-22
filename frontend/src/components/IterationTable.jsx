export function IterationTable({ iterations }) {
  if (!iterations?.length) return null
  
  // Generate column headers based on the first iteration
  const firstIteration = iterations[0]
  const numCols = firstIteration.tableau[0]?.length || 0
  const numVars = numCols - 1 // Last column is RHS
  
  // Create column headers
  const headers = []
  for (let i = 0; i < numVars; i++) {
    if (i < 2) {
      headers.push(`x${i + 1}`) // Decision variables
    } else if (i < numVars - 2) {
      headers.push(`s${i - 1}`) // Slack variables
    } else {
      headers.push(`a${i - numVars + 3}`) // Artificial variables
    }
  }
  headers.push('RHS') // Right-hand side
  
  return (
    <section style={{
      background: '#ffffff',
      border: '2px solid #4e6e5d',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      fontFamily: 'Lexend, sans-serif'
    }}>
      <h3 style={{ 
        fontFamily: 'Lexend, sans-serif', 
        color: '#181818',
        marginBottom: '20px',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        Tabla de Iteraciones
      </h3>
      {iterations.map((it, idx) => (
        <div key={it.iteration} className="pdf-no-break" style={{ 
          marginBottom: '24px',
          background: '#f8f9fa',
          border: '1px solid #4e6e5d',
          borderRadius: '8px',
          padding: '16px'
        }}>
          {/* Iteration Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: '#9bb560',
              color: '#181818',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              fontFamily: 'Lexend, sans-serif'
            }}>
              Iteración {it.iteration}
            </div>
            {it.entering_var && (
              <div style={{
                background: '#4e6e5d',
                color: '#ffffff',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontFamily: 'Lexend, sans-serif'
              }}>
                Entra: {it.entering_var}
              </div>
            )}
            {it.leaving_var && (
              <div style={{
                background: '#fa8072',
                color: '#ffffff',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontFamily: 'Lexend, sans-serif'
              }}>
                Sale: {it.leaving_var}
              </div>
            )}
          </div>
          
          {/* Comment */}
          <div style={{ 
            marginBottom: '12px', 
            fontSize: '13px', 
            color: '#181818',
            fontStyle: 'italic',
            lineHeight: '1.4'
          }}>
            {it.comment}
          </div>
          
          {/* Tableau */}
          <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <thead>
                <tr>
                  <th style={{
                    background: '#4e6e5d',
                    color: '#ffffff',
                    padding: '8px 4px',
                    border: '1px solid #4e6e5d',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    Base
                  </th>
                  {headers.map((header, i) => (
                    <th key={i} style={{
                      background: i < 2 ? '#9bb560' : i === headers.length - 1 ? '#fa8072' : '#6c757d',
                      color: i < 2 ? '#181818' : '#ffffff',
                      padding: '8px 4px',
                      border: '1px solid #4e6e5d',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {header}
                      {i < 2 && <div style={{ fontSize: '9px', opacity: 0.8 }}>Decisión</div>}
                      {i >= 2 && i < headers.length - 1 && <div style={{ fontSize: '9px', opacity: 0.8 }}>Holgura</div>}
                      {i === headers.length - 1 && <div style={{ fontSize: '9px', opacity: 0.8 }}>Lado Derecho</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {it.tableau.map((row, i) => (
                  <tr key={i}>
                    <td style={{
                      background: '#f8f9fa',
                      border: '1px solid #4e6e5d',
                      padding: '6px 8px',
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: '11px'
                    }}>
                      {it.basis[i] || `R${i + 1}`}
                    </td>
                    {row.map((v, j) => (
                      <td key={j} style={{
                        border: '1px solid #4e6e5d',
                        padding: '6px 4px',
                        textAlign: 'right',
                        background: i === it.tableau.length - 1 ? '#fff3cd' : '#ffffff',
                        fontWeight: i === it.tableau.length - 1 ? '600' : 'normal'
                      }}>
                        {typeof v === 'number' ? v.toFixed(3) : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Basis Information */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            flexWrap: 'wrap',
            fontSize: '12px',
            color: '#181818'
          }}>
            <div>
              <strong>Variables Básicas:</strong> 
              <span style={{ 
                background: '#9bb560', 
                color: '#181818', 
                padding: '2px 6px', 
                borderRadius: '4px', 
                marginLeft: '4px',
                fontSize: '11px'
              }}>
                {it.basis.join(', ')}
              </span>
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
