from pydantic import BaseModel

class IdentityRequest(BaseModel):
    name: str
    phone: str

class IdentityResponse(BaseModel):
    gigtrust_id: str
