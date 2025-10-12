# Simplex Solver

Proyecto de Ingeniería y Calidad de Software
Aplicación web para resolver Programación Lineal con método Simplex

## Integrantes

- Guevara, Pamela
- Geldes, Matías
- Taboada, Lautaro
- Donozo, Cristian

## Descripción

Aplicación Web que permite resolver problemas de programación lineal mediante el método simplex.

Permite ingresar datos del problema mediante interfaz gráfica. Puede seleccionarse si se trata de maximización o minimización. Se obtienen los resultados de variables, valor óptimo, iteraciones intermedias, etc.

Además, permite obtener los resultados en un documento PDF.

## Metodología

El desarrollo de este proyecto se basa en SCRUM, ejecutandose en sprints.

## Tecnologías/Frameworks

- Backend: Python 3.X y FastAPI
- Fronted: React

---

## Estructura

- `backend/`: API FastAPI para resolver problemas y cachear últimas operaciones.

## Requisitos

- Python 3.10 o superior

## Backend

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.app:app --reload --host 0.0.0.0 --port 8000
```

- Docs: `http://localhost:8000/docs`

## Tests

```bash
cd backend
pytest ./test_simplex_api.py

python -m tests.test_manual
```
