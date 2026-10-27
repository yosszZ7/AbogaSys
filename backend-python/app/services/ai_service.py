import os
from openai import OpenAI
from pydantic import BaseModel
from typing import Optional, List, Literal

class ExtractedField(BaseModel):
    valor: Optional[str] = None
    estado: Literal['encontrado', 'incierto', 'no_encontrado']
    evidencia: Optional[str] = None

class ExtractionSchema(BaseModel):
    numeroExpediente: ExtractedField
    juzgado: ExtractedField
    fechaDocumento: ExtractedField
    tipoDocumento: ExtractedField
    partes: List[str]
    abogados: List[str]
    fechasImportantes: List[str]
    resumen: str
    otrosDatos: List[str]

MAX_CHARS = 30000

_openai_client: Optional[OpenAI] = None

def get_openai_client() -> OpenAI:
    global _openai_client
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("La variable de entorno OPENAI_API_KEY no está configurada.")
    if _openai_client is None:
        _openai_client = OpenAI(api_key=api_key)
    return _openai_client

def extract_document_data(text: str) -> dict:
    """
    Realiza el análisis del texto jurídico mediante OpenAI.
    :param text: Texto puro extraído del documento PDF
    :return: Diccionario con los datos extraídos
    """
    analisis_parcial = False
    text_to_analyze = text

    if len(text) > MAX_CHARS:
        text_to_analyze = text[:MAX_CHARS]
        analisis_parcial = True

    client = get_openai_client()

    completion = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Eres un asistente jurídico. Extrae la información del documento provisto. "
                    "Si un dato no se encuentra, retorna null y marca el estado como \"no_encontrado\". "
                    "Extrae evidencia breve (ej. una frase). No inventes datos."
                ),
            },
            {
                "role": "user",
                "content": text_to_analyze,
            },
        ],
        response_format=ExtractionSchema,
    )

    parsed = completion.choices[0].message.parsed
    if not parsed:
        raise ValueError("No se pudo obtener una respuesta estructurada de la IA.")

    result = parsed.model_dump()
    result["analisisParcial"] = analisis_parcial
    return result
