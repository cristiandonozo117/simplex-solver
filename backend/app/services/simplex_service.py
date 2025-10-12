from __future__ import annotations

from typing import List, Tuple, Dict, Optional
import numpy as np

from ..models.simplex_models import SimplexRequest, SimplexResponse, Iteration, Solution


class SimplexService:
    BIG_M = 1e6

    def solve(self, req: SimplexRequest) -> SimplexResponse:
        try:
            c, A, b, var_names, basics_info = self._build_standard_form(req)
            iterations: List[Iteration] = []

            tableau, basis_names = self._initial_tableau(c, A, b, basics_info)
            iteration_idx = 0
            iterations.append(self._snapshot(iteration_idx, tableau, basis_names, None, None, None, "Tabla inicial."))

            while True:
                iteration_idx += 1
                enter_idx = self._choose_entering_variable(tableau)
                if enter_idx is None:
                    # Costos óptimos o todos reducidos cerca de 0
                    status, sol = self._extract_solution(tableau, basis_names, var_names)
                    if status == "optimal":
                        reduced = tableau[-1][:-1]
                        if any(abs(v) < 1e-9 for i, v in enumerate(reduced) if self._col_is_nonbasic(i, basis_names)):
                            sol.status = "multiple_optima"
                    return SimplexResponse(iterations=iterations, solution=sol)

                leave_row = self._choose_leaving_row(tableau, enter_idx)
                if leave_row is None:
                    sol = Solution(status="unbounded", message="La solución es no acotada.")
                    return SimplexResponse(iterations=iterations, solution=sol)

                leaving_var = basis_names[leave_row]
                entering_var = self._column_name(enter_idx, var_names)

                self._pivot(tableau, leave_row, enter_idx)
                basis_names[leave_row] = entering_var

                iterations.append(
                    self._snapshot(
                        iteration_idx,
                        tableau,
                        basis_names,
                        entering_var,
                        leaving_var,
                        (leave_row, enter_idx),
                        f"Pivote en fila {leave_row+1}, columna {enter_idx+1}. Entra {entering_var}, sale {leaving_var}.",
                    )
                )
        except Exception as exc:
            sol = Solution(status="error", message=f"Error al resolver: {exc}")
            return SimplexResponse(iterations=[], solution=sol)

    # ---------- Construcción del formulario estándar para la resolución del problema  ----------
    def _build_standard_form(self, req: SimplexRequest):
        sense = req.objective.sense
        c = np.array(req.objective.coefficients, dtype=float)
        num_vars = len(c)

        # La variable 'sense' para el caso de 'minimización', se multiplica por -1
        if sense == "min":
            c = -c

        rows: List[np.ndarray] = []
        b_list: List[float] = []
        aug_cols: List[Tuple[str, int]] = []  # (type, index) type en {"slack","surplus","artif"}

        for cons in req.constraints:
            a = np.array(cons.coefficients, dtype=float)
            rhs = float(cons.rhs)

            # Asegurar que el lado derecho (RHS) no sea negativo multiplicando ambos lados si es necesario
            sign = cons.sign
            if rhs < 0:
                a = -a
                rhs = -rhs
                if sign == "<=":
                    sign = ">="
                elif sign == ">=":
                    sign = "<="
                # '=' remains '='

            rows.append(a)
            b_list.append(rhs)
            if sign == "<=":
                aug_cols.append(("slack", 1))
            elif sign == ">=":
                aug_cols.append(("surplus_artif", 2))  # surplus + artificial
            elif sign == "=":
                aug_cols.append(("artif", 1))
            else:
                raise ValueError(f"Signo no soportado: {cons.sign}")

        A = np.vstack(rows) if rows else np.zeros((0, num_vars))
        b = np.array(b_list, dtype=float)
        m = A.shape[0]

        # Armado de la matriz aumentada con columnas slack/surplus/artificial
        slack_cols = []
        artificial_cols = []
        surplus_cols = []

        aug_matrix = A
        for row_idx, kind in enumerate(aug_cols):
            if kind[0] == "slack":
                col = np.zeros((m,))
                col[row_idx] = 1.0
                aug_matrix = np.column_stack([aug_matrix, col])
                slack_cols.append(aug_matrix.shape[1] - 1)
            elif kind[0] == "surplus_artif":
                # Añadir variable surplus (-1) y artificial (+1)
                col_surplus = np.zeros((m,))
                col_surplus[row_idx] = -1.0
                aug_matrix = np.column_stack([aug_matrix, col_surplus])
                surplus_cols.append(aug_matrix.shape[1] - 1)

                col_art = np.zeros((m,))
                col_art[row_idx] = 1.0
                aug_matrix = np.column_stack([aug_matrix, col_art])
                artificial_cols.append(aug_matrix.shape[1] - 1)
            elif kind[0] == "artif":
                col_art = np.zeros((m,))
                col_art[row_idx] = 1.0
                aug_matrix = np.column_stack([aug_matrix, col_art])
                artificial_cols.append(aug_matrix.shape[1] - 1)

        # Fila objetivo: maximizar => -c en tableau (según la convención de la fila de costos reducidos)
        c_full = np.concatenate([c, np.zeros(aug_matrix.shape[1] - num_vars)])
        # Penalizar las variables artificiales con −M (dado que, al maximizar, los costos negativos las hacen muy indeseables)
        for j in artificial_cols:
            c_full[j] = -self.BIG_M
        # Las variables surplus y slack valen 0

        var_names = [f"x{j+1}" for j in range(num_vars)]
        var_names += [f"s{idx+1}" for idx in range(len(slack_cols))]
        var_names += [f"u{idx+1}" for idx in range(len(surplus_cols))]
        var_names += [f"a{idx+1}" for idx in range(len(artificial_cols))]

        basics_info = {
            "slack_rows": slack_cols,
            "artificial_rows": artificial_cols,
        }

        return c_full, aug_matrix, b, var_names, basics_info

    def _initial_tableau(self, c: np.ndarray, A: np.ndarray, b: np.ndarray, basics_info: Dict) -> Tuple[List[List[float]], List[str]]:
        m, n = A.shape
        tableau = np.zeros((m + 1, n + 1))
        tableau[:m, :n] = A
        tableau[:m, -1] = b
        tableau[-1, :n] = -c  # La tabla simplex usa coeficientes objetivos negativos
        tableau[-1, -1] = 0.0

        # Elegir una base factible inicial: preferir las variables de holgura (columnas identidad).
        # Si hay variables artificiales, esas formarán la base
        basis_names: List[str] = []
        # Intentar encontrar una columna identidad en todas las columnas
        for i in range(m):
            col = tableau[:m, i]
        
        # Identificar las columnas básicas escaneando el patrón identidad por fila
        used_cols = set()
        for row_idx in range(m):
            col_idx = self._find_basic_column(tableau[:m, : -1], row_idx, used_cols)
            if col_idx is None:
                # Elegir la columna artificial si existe alguna para esa fila
                col_idx = self._find_artificial_for_row(tableau[:m, : -1], row_idx)
                if col_idx is None:
                    # Dejar el nombre de la variable básica como 'desconocido'; el algoritmo pivotará
                    basis_names.append(f"b{row_idx+1}")
                    continue
            used_cols.add(col_idx)
            basis_names.append(self._column_name(col_idx, None))

        # Si alguna variable artificial está en la base, ajustar la fila objetivo para reflejar la base inicial
        # Hacer que la fila Z (objetivo) sea consistente con la base actual: z_row = -c + sum(M * row_of_artificial)
        for row_idx, name in enumerate(basis_names):
            if name.startswith("a"):
                tableau[-1, :] += self.BIG_M * tableau[row_idx, :]

        return tableau.tolist(), basis_names

    def _find_basic_column(self, mat: np.ndarray, row_idx: int, used_cols: set) -> Optional[int]:
        m, n = mat.shape
        for j in range(n):
            if j in used_cols:
                continue
            col = mat[:, j]
            if np.allclose(col, 0) and np.isclose(col[row_idx], 0):
                continue
            if np.count_nonzero(~np.isclose(col, 0)) == 1 and np.isclose(col[row_idx], 1.0):
                return j
        return None

    def _find_artificial_for_row(self, mat: np.ndarray, row_idx: int) -> Optional[int]:
        m, n = mat.shape
        for j in range(n):
            col = mat[:, j]
            if np.count_nonzero(~np.isclose(col, 0)) == 1 and np.isclose(col[row_idx], 1.0):
                return j
        return None

    # ---------- Núcleo del método simplex ----------
    def _choose_entering_variable(self, tableau: List[List[float]]) -> Optional[int]:
        last_row = tableau[-1]
        reduced_costs = last_row[:-1]
        # Para maximización, con la convención de la tabla (−c en la última fila), elegimos el costo reducido más negativo
        min_value = min(reduced_costs)
        if min_value >= -1e-9:
            return None
        return int(np.argmin(reduced_costs))

    def _choose_leaving_row(self, tableau: List[List[float]], enter_idx: int) -> Optional[int]:
        ratios = []
        for i, row in enumerate(tableau[:-1]):
            a = row[enter_idx]
            if a <= 1e-12:
                ratios.append(np.inf)
                continue
            ratios.append(row[-1] / a)
        min_ratio = min(ratios)
        if np.isinf(min_ratio):
            return None
        # Desempate de la regla de Bland: elegir el índice más pequeño entre los empates
        candidates = [i for i, r in enumerate(ratios) if abs(r - min_ratio) < 1e-9]
        return candidates[0]

    def _pivot(self, tableau: List[List[float]], row_idx: int, col_idx: int) -> None:
        t = np.array(tableau, dtype=float)
        pivot = t[row_idx, col_idx]
        t[row_idx, :] /= pivot
        for i in range(t.shape[0]):
            if i == row_idx:
                continue
            factor = t[i, col_idx]
            t[i, :] -= factor * t[row_idx, :]
        for i in range(len(tableau)):
            tableau[i] = t[i, :].tolist()

    def _snapshot(self, it: int, tableau: List[List[float]], basis: List[str], entering: Optional[str], leaving: Optional[str], pivot: Optional[Tuple[int,int]], comment: str) -> Iteration:
        return Iteration(
            iteration=it,
            tableau=[[round(v, 6) for v in row] for row in tableau],
            basis=basis.copy(),
            entering_var=entering,
            leaving_var=leaving,
            pivot_position=pivot,
            comment=comment,
        )

    def _col_is_nonbasic(self, col_idx: int, basis_names: List[str]) -> bool:
            # Si coincide con la columna, considerar mapear la variable desconocida; devolver True de forma conservadora
        for name in basis_names:
            pass
        return True

    def _column_name(self, col_idx: int, var_names: Optional[List[str]]) -> str:
        if var_names and 0 <= col_idx < len(var_names):
            return var_names[col_idx]
        return f"v{col_idx+1}"

    def _extract_solution(self, tableau: List[List[float]], basis_names: List[str], var_names: List[str]) -> Tuple[str, Solution]:
        t = np.array(tableau, dtype=float)
        m, n_plus = t.shape
        n = n_plus - 1
        values: Dict[str, float] = {name: 0.0 for name in var_names}
        for i, name in enumerate(basis_names):
            if name in values:
                values[name] = t[i, -1]
        objective_value = t[-1, -1]

        # Comprobar variables artificiales en la base con valor positivo → infactible
        if any(name.startswith("a") and values.get(name, 0.0) > 1e-7 for name in basis_names):
            sol = Solution(status="infeasible", objective_value=None, variable_values=None, message="Problema infeasible (variables artificiales positivas en la base).")
            return "infeasible", sol

        # Calcular los precios sombra (o precios duales) usando y = c_B^T B^{-1} (solo para el número de variables reales)
        try:
            # Identificar los índices de las columnas básicas basándose en los nombres en lo posible
            # tomar las primeras len(basis) columnas que forman la identidad
            B = t[:-1, :-1][:, [self._find_basic_column(t[:-1, :-1], i, set()) or 0 for i in range(m - 1)]]
            y = None
            if B.size:
                y = np.linalg.pinv(B.T) @ t[-1:, :-1].T
        except Exception:
            y = None

        shadow_prices: Dict[str, float] = {}
        if y is not None:
            for i in range(len(y)):
                shadow_prices[f"y{i+1}"] = float(y[i])

        sol = Solution(status="optimal", objective_value=float(objective_value), variable_values=values, shadow_prices=shadow_prices)
        return "optimal", sol
