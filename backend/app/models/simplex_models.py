from typing import List, Literal, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field, validator


Sense = Literal["max", "min"]
Sign = Literal["=", "<", "<=", ">", ">="]


class Objective(BaseModel):
    coefficients: List[float] = Field(..., description="Coefficients of the objective function in variable order")
    sense: Sense = Field("max", description="Optimization sense: max or min")


class Constraint(BaseModel):
    coefficients: List[float] = Field(..., description="Constraint coefficients aligned with variables")
    sign: Sign = Field("<=", description="Constraint sign: one of =, <, <=, >, >=")
    rhs: float = Field(..., description="Right-hand side value")

    @validator("sign")
    def normalize_sign(cls, v: str) -> str:
        if v == "<":
            return "<="
        if v == ">":
            return ">="
        return v


class SimplexRequest(BaseModel):
    objective: Objective
    constraints: List[Constraint]
    variable_names: Optional[List[str]] = None


class Iteration(BaseModel):
    iteration: int
    tableau: List[List[float]]
    basis: List[str]
    entering_var: Optional[str] = None
    leaving_var: Optional[str] = None
    pivot_position: Optional[Tuple[int, int]] = None
    comment: str


class Solution(BaseModel):
    status: Literal["optimal", "unbounded", "infeasible", "multiple_optima", "error"]
    objective_value: Optional[float] = None
    variable_values: Optional[Dict[str, float]] = None
    shadow_prices: Optional[Dict[str, float]] = None
    message: Optional[str] = None


class SimplexResponse(BaseModel):
    iterations: List[Iteration]
    solution: Solution
    notes: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
