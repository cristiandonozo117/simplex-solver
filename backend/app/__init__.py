from fastapi import FastAPI

def create_app():
    app = FastAPI(title='Simplex Solver')
    return app
