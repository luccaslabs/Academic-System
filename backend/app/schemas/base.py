from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PublicIdResponse(ORMModel):
    id: str = Field(validation_alias="public_id")