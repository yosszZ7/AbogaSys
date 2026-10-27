import os
import pypdf
from ..api.routers.documentos import resolve_file_path

def extract_text_from_pdf(ruta_relativa: str) -> str:
    """
    Lee un archivo PDF y extrae su texto.
    :param ruta_relativa: Ruta relativa o nombre del archivo
    :return: Texto extraído
    """
    safe_path = resolve_file_path(ruta_relativa)

    if not os.path.exists(safe_path):
        raise ValueError("El archivo físico no fue encontrado en el servidor.")

    ext = os.path.splitext(safe_path)[1].lower()
    if ext != ".pdf":
        raise ValueError("El Asistente IA actualmente solo soporta archivos PDF.")

    reader = pypdf.PdfReader(safe_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"

    text = text.strip()
    if not text or len(text) < 50:
        raise ValueError(
            "Este documento parece ser escaneado o no contiene texto extraíble. El soporte OCR estará disponible en una fase posterior."
        )

    return text
