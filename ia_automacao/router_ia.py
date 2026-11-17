from fastapi import APIRouter
from pydantic import BaseModel, Field
from .motor_ia import acionar_agente_e_automacao

router = APIRouter(prefix="/api/ia", tags=["IA e Automação"])

class LeituraInput(BaseModel):
    regiao: str = Field(..., example="Vila Itaim")
    chuva_mm_h: float = Field(..., example=58.0)
    vento_km_h: float = Field(..., example=64.0)
    temperatura_c: float = Field(default=26.0, example=23.0)

@router.post("/analisar-risco")
def analisar_risco(dados: LeituraInput):
    return acionar_agente_e_automacao(
        regiao=dados.regiao,
        chuva_mm_h=dados.chuva_mm_h,
        vento_km_h=dados.vento_km_h,
        temperatura_c=dados.temperatura_c
    )