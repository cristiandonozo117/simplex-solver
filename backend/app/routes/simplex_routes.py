from fastapi import APIRouter
from typing import Any

from ..models.simplex_models import SimplexRequest, SimplexResponse
from ..services.simplex_service import SimplexService
from ..cache import cache

router = APIRouter()
service = SimplexService()


@router.post("/solve", response_model=SimplexResponse)
async def solve(req: SimplexRequest) -> Any:
    result = service.solve(req)
    cache.add({
       
        "request": req.model_dump(),
        "response": result.model_dump()
    })
    return result


@router.get("/last")
async def last() -> Any:
    return {"items": cache.list()}


@router.delete("/last/{index}")
async def delete_last(index: int) -> Any:
    print(f"Attempting to delete item at index: {index}")
    print(f"Current cache size: {len(cache.list())}")
    success = cache.delete(index)
    print(f"Delete operation successful: {success}")
    if success:
        return {"message": "Item deleted successfully"}
    else:
        return {"error": "Index out of range"}


@router.delete("/last/clear")
async def clear_last() -> Any:
    cache.clear()
    return {"message": "All cached items cleared"}