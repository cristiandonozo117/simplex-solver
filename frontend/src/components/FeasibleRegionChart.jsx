import { ResponsiveContainer, Line, XAxis, YAxis, Tooltip, CartesianGrid, ComposedChart } from 'recharts'
import { MdWarning, MdBlock, MdRefresh, MdCheckCircle } from 'react-icons/md'

export function FeasibleRegionChart({ constraints, solution, objective }) {
  if (!constraints || constraints.length === 0) return null
  // Only meaningful when variables are 2
  const is2D = constraints.every((c) => (c.coefficients?.length ?? 0) === 2)
  if (!is2D) {
    return (
      <section>
        <h3>Gráfica</h3>
        <div>Para n &gt; 2 no es posible mostrar la región factible.</div>
      </section>
    )
  }

  // Debug: log the data we're receiving
  console.log('FeasibleRegionChart received:', { constraints, solution, objective })

  // Calculate constraint lines
  const { constraintLines } = calculateConstraintLines(constraints)
  
  // Get optimal point(s) and calculate objective value
  let optimalPoints = []
  let solutionStatus = solution?.status || 'unknown'
  let objectiveValue = solution?.objective_value || null
  
  // Calculate objective value if not provided
  if (objectiveValue === null && solution?.variable_values && objective) {
    const x1 = solution.variable_values['x1'] || 
               solution.variable_values['x₁'] || 
               solution.variable_values['x_1'] || 
               solution.variable_values['X1'] || 0
    
    const x2 = solution.variable_values['x2'] || 
               solution.variable_values['x₂'] || 
               solution.variable_values['x_2'] || 
               solution.variable_values['X2'] || 0
    
    if (objective.coefficients && objective.coefficients.length >= 2) {
      objectiveValue = objective.coefficients[0] * x1 + objective.coefficients[1] * x2
    }
  }
  
  if (solution?.variable_values && solutionStatus === 'optimal') {
    // Single optimal solution
    const x1 = solution.variable_values['x1'] || 
               solution.variable_values['x₁'] || 
               solution.variable_values['x_1'] || 
               solution.variable_values['X1'] || 0
    
    const x2 = solution.variable_values['x2'] || 
               solution.variable_values['x₂'] || 
               solution.variable_values['x_2'] || 
               solution.variable_values['X2'] || 0
    
    if (x1 !== 0 || x2 !== 0) {
      optimalPoints = [{ x: Number(x1), y: Number(x2) }]
    }
  } else if (solution?.variable_values && solutionStatus === 'multiple_optima') {
    // For multiple optima, we need to find all optimal solutions
    // This is a simplified approach - in practice, you'd need to find all vertices of the optimal face
    const x1 = solution.variable_values['x1'] || 
               solution.variable_values['x₁'] || 
               solution.variable_values['x_1'] || 
               solution.variable_values['X1'] || 0
    
    const x2 = solution.variable_values['x2'] || 
               solution.variable_values['x₂'] || 
               solution.variable_values['x_2'] || 
               solution.variable_values['X2'] || 0
    
    if (x1 !== 0 || x2 !== 0) {
      // For now, show the main solution and indicate there are multiple
      optimalPoints = [{ x: Number(x1), y: Number(x2) }]
    }
  }
  
  // Calculate bounds from constraints
  let maxX = 10
  let maxY = 10
  
  try {
    const constraintBounds = constraints.flatMap(c => {
      const [a, b] = c.coefficients
      const rhs = c.rhs
      const points = []
      
      // Intersection with x-axis (y=0)
      if (a !== 0) {
        points.push({ x: rhs / a, y: 0 })
      }
      // Intersection with y-axis (x=0)
      if (b !== 0) {
        points.push({ x: 0, y: rhs / b })
      }
      return points
    }).filter(p => p.x >= 0 && p.y >= 0)
    
    if (constraintBounds.length > 0) {
      maxX = Math.max(...constraintBounds.map(p => p.x), 10)
      maxY = Math.max(...constraintBounds.map(p => p.y), 10)
    }
  } catch (error) {
    console.error('Error calculating bounds:', error)
    maxX = 10
    maxY = 10
  }
  
  // Generate data for constraint lines
  const xs = Array.from({ length: 101 }, (_, i) => (i * maxX) / 100)
  
  const constraintData = constraintLines.map((line, idx) => {
    try {
      const data = xs.map((x) => {
        const y = line.slope !== null ? line.slope * x + line.intercept : null
        return { x, y, constraint: `R${idx + 1}` }
      }).filter(point => point.y !== null && point.y >= 0)
      return { ...line, data }
    } catch (error) {
      console.error(`Error generating constraint data for line ${idx}:`, error)
      return { ...line, data: [] }
    }
  })


  return (
    <section>
      <h3 style={{ fontFamily: 'Lexend, sans-serif', color: '#181818' }}>Región factible</h3>
      
      {/* Solution Status Message */}
      {solutionStatus === 'unbounded' && (
        <div style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          border: '2px solid #fa8072',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          color: '#181818',
          fontFamily: 'Lexend, sans-serif',
          boxShadow: '0 4px 12px rgba(220, 53, 69, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <MdWarning style={{ fontSize: '24px', color: '#fa8072' }} />
            <strong style={{ fontSize: '16px' }}>Problema no acotado</strong>
          </div>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
            La función objetivo puede crecer indefinidamente. No existe una solución óptima finita.
          </p>
        </div>
      )}
      
      {solutionStatus === 'infeasible' && (
        <div style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          border: '2px solid #fa8072',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          color: '#181818',
          fontFamily: 'Lexend, sans-serif',
          boxShadow: '0 4px 12px rgba(220, 53, 69, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <MdBlock style={{ fontSize: '24px', color: '#fa8072' }} />
            <strong style={{ fontSize: '16px' }}>Problema infactible</strong>
          </div>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
            No existe ninguna solución que satisfaga todas las restricciones simultáneamente.
          </p>
        </div>
      )}
      
      {solutionStatus === 'multiple_optima' && (
        <div style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          border: '2px solid #9bb560',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          color: '#181818',
          fontFamily: 'Lexend, sans-serif',
          boxShadow: '0 4px 12px rgba(191, 226, 32, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <MdRefresh style={{ fontSize: '24px', color: '#9bb560' }} />
            <strong style={{ fontSize: '16px' }}>Soluciones óptimas múltiples</strong>
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5' }}>
            Existen múltiples puntos que maximizan la función objetivo.
          </p>
          {optimalPoints.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <strong style={{ fontSize: '14px' }}>Solución principal encontrada:</strong>
              <div style={{ 
                background: '#ffffff', 
                border: '1px solid #4e6e5d', 
                borderRadius: '8px', 
                padding: '12px', 
                marginTop: '8px',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}>
                ({optimalPoints[0].x.toFixed(3)}, {optimalPoints[0].y.toFixed(3)})
              </div>
            </div>
          )}
        </div>
      )}
      
      {solutionStatus === 'optimal' && objectiveValue !== null && (
        <div style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          border: '2px solid #9bb560',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          color: '#181818',
          fontFamily: 'Lexend, sans-serif',
          boxShadow: '0 4px 12px rgba(191, 226, 32, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <MdCheckCircle style={{ fontSize: '24px', color: '#9bb560' }} />
            <strong style={{ fontSize: '16px' }}>Solución óptima encontrada</strong>
          </div>
          <div style={{ 
            background: '#ffffff', 
            border: '1px solid #4e6e5d', 
            borderRadius: '8px', 
            padding: '12px', 
            marginTop: '8px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            <strong>Valor objetivo: Z = {objectiveValue.toFixed(3)}</strong>
          </div>
        </div>
      )}
      
      {/* Chart Card */}
      <div className="pdf-no-break pdf-page-break-before" style={{
        background: '#ffffff',
        border: '1px solid #4e6e5d',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative'
      }}>
        <div style={{ position: 'relative', width: '100%', height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f8f9fa" />
              <XAxis 
                type="number" 
                dataKey="x" 
                domain={[0, maxX * 1.1]} 
                allowDecimals={true}
                label={{ value: 'x₁', position: 'insideBottom', offset: -10 }}
                tick={{ fontFamily: 'Lexend, sans-serif', fontSize: 12, fill: '#181818' }}
              />
              <YAxis 
                type="number" 
                domain={[0, maxY * 1.1]} 
                allowDecimals={true}
                label={{ value: 'x₂', angle: -90, position: 'insideLeft' }}
                tick={{ fontFamily: 'Lexend, sans-serif', fontSize: 12, fill: '#181818' }}
              />
              <Tooltip 
                formatter={(value, name) => [value?.toFixed(3), name]}
                labelFormatter={(label) => `x₁: ${label?.toFixed(3)}`}
                contentStyle={{ 
                  fontFamily: 'Lexend, sans-serif',
                  backgroundColor: '#ffffff',
                  border: '1px solid #4e6e5d',
                  borderRadius: '6px'
                }}
              />
              
              {/* Constraint lines */}
              {constraintData.map((line, idx) => (
                <Line
                  key={`constraint-${idx}`}
                  data={line.data}
                  dataKey="y"
                  dot={false}
                  isAnimationActive={false}
                  stroke={line.color}
                  strokeWidth={2}
                  name={`Restricción ${idx + 1}`}
                />
              ))}
              
              {/* Optimal solution points - show for optimal and multiple optima solutions */}
              {optimalPoints.length > 0 && (solutionStatus === 'optimal' || solutionStatus === 'multiple_optima') && (
                <Line
                  data={optimalPoints}
                  dataKey="y"
                  dot={{ fill: "#9bb560", r: 8, stroke: "#4e6e5d", strokeWidth: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                  stroke="none"
                  name=""
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Legend */}
      <div style={{ 
        background: '#f8f9fa',
        border: '1px solid #4e6e5d',
        borderRadius: '6px',
        padding: '12px',
        fontSize: '14px',
        fontFamily: 'Lexend, sans-serif',
        color: '#181818'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          {constraintData.map((line, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 20, height: 3, backgroundColor: line.color, borderRadius: '2px' }}></div>
              <span><strong>R{idx + 1}:</strong> {line.equation}</span>
            </div>
          ))}
          {optimalPoints.length > 0 && (solutionStatus === 'optimal' || solutionStatus === 'multiple_optima') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 12, height: 12, backgroundColor: '#9bb560', borderRadius: '50%', border: '2px solid #4e6e5d' }}></div>
              <span>
                <strong>
                  {solutionStatus === 'multiple_optima' ? 'Solución Óptima (Principal):' : 'Solución Óptima:'}
                </strong>
                {` (${optimalPoints[0].x?.toFixed(3)}, ${optimalPoints[0].y?.toFixed(3)})`}
                {objectiveValue !== null && ` - Z = ${objectiveValue.toFixed(3)}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function calculateConstraintLines(constraints) {
  // Colors for constraint lines using the new palette
  const colors = ['#4e6e5d', '#9bb560', '#181818', '#8b9dc3', '#6c757d', '#495057']
  
  // Calculate constraint lines
  const constraintLines = constraints.map((constraint, idx) => {
    const [a, b] = constraint.coefficients
    const rhs = constraint.rhs
    const sign = constraint.sign
    
    let slope = null
    let intercept = null
    let equation = ''
    
    if (b !== 0) {
      slope = -a / b
      intercept = rhs / b
      equation = `${a}x₁ + ${b}x₂ ${sign} ${rhs}`
    } else if (a !== 0) {
      // Vertical line: x = rhs/a
      equation = `x₁ ${sign} ${rhs/a}`
    }
    
    return {
      slope,
      intercept,
      equation,
      color: colors[idx % colors.length],
      sign,
      a, b, rhs
    }
  })
  
  return { constraintLines }
}

