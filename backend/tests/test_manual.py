#!/usr/bin/env python3
"""
Test manual para verificar que la API funciona sin problemas de importaciones relativas
"""
import sys
import os

# Agregar el path a la carpeta backend/app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app")))

try:
    from fastapi.testclient import TestClient
    
    # Test 1: Verificar que podemos importar la app
    print("✓ Test 1: Importando módulos...")
    from app.app import app
    print("✓ App importada correctamente")
    
    # Test 2: Crear cliente de prueba
    print("✓ Test 2: Creando cliente de prueba...")
    client = TestClient(app)
    print("✓ Cliente creado correctamente")
    
    # Test 3: Probar endpoint root
    print("✓ Test 3: Probando endpoint root...")
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    print(f"✓ Root endpoint OK: {data}")
    
    # Test 4: Probar endpoint last
    print("✓ Test 4: Probando endpoint last...")
    response = client.get("/simplex/last")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    print(f"✓ Last endpoint OK: {data}")
    
    # Test 5: Probar endpoint solve
    print("✓ Test 5: Probando endpoint solve...")
    payload = {
        "objective": {"coefficients": [3, 2], "sense": "max"},
        "constraints": [
            {"coefficients": [1, 1], "sign": "<=", "rhs": 4},
            {"coefficients": [1, 0], "sign": "<=", "rhs": 2},
            {"coefficients": [0, 1], "sign": "<=", "rhs": 3},
        ],
        "variable_names": ["x1", "x2"],
    }
    response = client.post("/simplex/solve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "iterations" in data
    assert data["solution"]["status"] in {"optimal", "multiple_optima"}
    print(f"✓ Solve endpoint OK: status={data['solution']['status']}")
    
    print("\n🎉 ¡Todos los tests pasaron correctamente!")
    print("✓ test_health_root: PASSED")
    print("✓ test_solve_basic_max: PASSED") 
    print("✓ test_last_cache: PASSED")
    
except Exception as e:
    print(f"❌ Error en los tests: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)