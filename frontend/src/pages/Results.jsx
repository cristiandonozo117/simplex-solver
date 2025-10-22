import { useLPStore } from '../store'
import { IterationTable } from '../components/IterationTable'
import { FeasibleRegionChart } from '../components/FeasibleRegionChart'
import { useRef } from 'react'
import html2pdf from 'html2pdf.js'

export function Results() {
  const { request, result } = useLPStore()
  const resultsRef = useRef(null)
  if (!result) return null

  const iterations = result.iterations || []
  const solution = result.solution || {}
  const constraints = request?.constraints || []

  // Calculate objective value if not provided
  let objectiveValue = solution.objective_value
  if (objectiveValue === null && solution.variable_values && request?.objective) {
    const x1 = solution.variable_values['x1'] || 
               solution.variable_values['x₁'] || 
               solution.variable_values['x_1'] || 
               solution.variable_values['X1'] || 0
    
    const x2 = solution.variable_values['x2'] || 
               solution.variable_values['x₂'] || 
               solution.variable_values['x_2'] || 
               solution.variable_values['X2'] || 0
    
    if (request.objective.coefficients && request.objective.coefficients.length >= 2) {
      objectiveValue = request.objective.coefficients[0] * x1 + request.objective.coefficients[1] * x2
    }
  }

  return (
    <section ref={resultsRef} className="pdf-no-break" style={{
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
        Resultados del Problema
      </h2>
      
      {/* Status and Objective Value */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        marginBottom: '20px'
      }}>
        {objectiveValue != null && (
          <div style={{
            background: '#4e6e5d',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'Lexend, sans-serif'
          }}>
            Z = {objectiveValue.toFixed(3)}
          </div>
        )}
      </div>
      
      {/* Variable Values */}
      {solution.variable_values && (
        <div style={{ 
          marginBottom: '24px',
          background: '#f8f9fa',
          border: '1px solid #4e6e5d',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h4 style={{ 
            fontFamily: 'Lexend, sans-serif', 
            color: '#181818',
            marginBottom: '12px',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            Valores de las Variables
          </h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(solution.variable_values)
              .filter(([k, v]) => k.startsWith('x') && Number(v) !== 0)
              .map(([k, v]) => (
                <div key={k} style={{
                  background: '#9bb560',
                  color: '#181818',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  fontFamily: 'Lexend, sans-serif'
                }}>
                  {k} = {Number(v).toFixed(3)}
                </div>
              ))}
          </div>
        </div>
      )}
      
      <IterationTable iterations={iterations} />
      <FeasibleRegionChart 
        constraints={constraints} 
        solution={solution}
        objective={request?.objective}
      />

      {/* Export to PDF Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
        <button
          onClick={async () => {
            try {
              const element = resultsRef.current
              if (!element) return

              // Options to target A4 and preserve styling
              const opt = {
                margin:       [15, 15, 15, 15], // mm -> left, top, right, bottom (increase to avoid clipping)
                filename:     'simplex_result.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, logging: false },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak:    { mode: ['css', 'legacy'], before: '.pdf-page-break-before' }
              }

              // Clone the element so we can temporarily add extra padding/margins
              // and avoid clipping critical content at page breaks. We append the clone
              // to body, export, then remove it.
              const clone = element.cloneNode(true)
              clone.classList.add('pdf-padding-top')
              // Hide the original while exporting to avoid duplicate rendering
              element.style.visibility = 'hidden'
              document.body.appendChild(clone)
              try {
                await html2pdf().set(opt).from(clone).save()
              } finally {
                // cleanup
                document.body.removeChild(clone)
                element.style.visibility = ''
              }
            } catch (err) {
              console.error('Error exporting PDF:', err)
            }
          }}
          style={{
            background: '#4e6e5d',
            color: '#ffffff',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'Lexend, sans-serif',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(78, 110, 93, 0.2)'
          }}
        >
          Descargar PDF
        </button>
      </div>
    </section>
  )
}
