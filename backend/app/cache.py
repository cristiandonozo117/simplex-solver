from collections import deque
from typing import Any, Dict, List


class InMemoryCache:
    def __init__(self, maxlen: int = 10) -> None:
        self._data: deque = deque(maxlen=maxlen)

    def add(self, item: Dict[str, Any]) -> None:
        self._data.appendleft(item)

    def list(self) -> List[Dict[str, Any]]:
        return list(self._data)
    
    def delete(self, index: int) -> bool:
        """Delete item at specific index"""
        print(f"Cache delete called with index: {index}")
        print(f"Current cache contents: {list(self._data)}")
        if 0 <= index < len(self._data):
            item_to_delete = self._data[index]
            print(f"Deleting item: {item_to_delete}")
            del self._data[index]
            print(f"Cache after deletion: {list(self._data)}")
            return True
        print(f"Index {index} out of range (0-{len(self._data)-1})")
        return False
    
    def clear(self) -> None:
        """Clear all cached items"""
        self._data.clear()


cache = InMemoryCache(maxlen=10)
