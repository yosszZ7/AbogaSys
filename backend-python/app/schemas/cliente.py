from pydantic import BaseModel
from typing import Optional

class ClienteCreate(BaseModel):
    tipoCliente: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    direccion: Optional[str] = None

    # Campos Persona Natural
    primerNombre: Optional[str] = None
    segundoNombre: Optional[str] = None
    primerApellido: Optional[str] = None
    segundoApellido: Optional[str] = None
    cedula: Optional[str] = None
    fechaNacimiento: Optional[str] = None
    sexo: Optional[str] = None
    estadoCivil: Optional[str] = None
    tipoSangre: Optional[str] = None
    observaciones: Optional[str] = None

    # Campos Persona Jurídica
    razonSocial: Optional[str] = None
    nombreComercial: Optional[str] = None
    ruc: Optional[str] = None
    representantePrimerNombre: Optional[str] = None
    representanteSegundoNombre: Optional[str] = None
    representantePrimerApellido: Optional[str] = None
    representanteSegundoApellido: Optional[str] = None
    representanteCedula: Optional[str] = None

class ClienteUpdate(BaseModel):
    telefono: Optional[str] = None
    correo: Optional[str] = None
    direccion: Optional[str] = None

    # Campos Persona Natural
    primerNombre: Optional[str] = None
    segundoNombre: Optional[str] = None
    primerApellido: Optional[str] = None
    segundoApellido: Optional[str] = None
    cedula: Optional[str] = None
    fechaNacimiento: Optional[str] = None
    sexo: Optional[str] = None
    estadoCivil: Optional[str] = None
    tipoSangre: Optional[str] = None
    observaciones: Optional[str] = None

    # Campos Persona Jurídica
    razonSocial: Optional[str] = None
    nombreComercial: Optional[str] = None
    ruc: Optional[str] = None
    representantePrimerNombre: Optional[str] = None
    representanteSegundoNombre: Optional[str] = None
    representantePrimerApellido: Optional[str] = None
    representanteSegundoApellido: Optional[str] = None
    representanteCedula: Optional[str] = None
