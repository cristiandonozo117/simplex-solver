import pytest
from fastapi.testclient import TestClient

from app.app import app

client = TestClient(app)


def test_health_root():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_solve_basic_max():
    payload = {
        "objective": {"coefficients": [3, 2], "sense": "max"},
        "constraints": [
            {"coefficients": [1, 1], "sign": "<=", "rhs": 4},
            {"coefficients": [1, 0], "sign": "<=", "rhs": 2},
            {"coefficients": [0, 1], "sign": "<=", "rhs": 3},
        ],
        "variable_names": ["x1", "x2"],
    }
    res = client.post("/simplex/solve", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "iterations" in data
    assert data["solution"]["status"] in {"optimal", "multiple_optima"}


def test_last_cache():
    res = client.get("/simplex/last")
    assert res.status_code == 200
    assert "items" in res.json()
