from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.exceptions.academic_exceptions import DisciplinaNaoEncontradaError
from app.repositories.discipline_repository import DisciplineRepository
from app.schemas.academic_schema import (
    DisciplineCreateRequest,
    DisciplineResponse,
    DisciplineUpdateRequest,
)
from app.services.auth_dependencies import get_current_user, require_admin
from app.services.discipline_service import DisciplineService


router = APIRouter(prefix="/disciplines", tags=["Disciplines"])


def get_discipline_service(db: Session = Depends(get_db)):
    return DisciplineService(DisciplineRepository(db))


@router.post("", response_model=DisciplineResponse)
def create_discipline(
    data: DisciplineCreateRequest,
    admin=Depends(require_admin),
    service: DisciplineService = Depends(get_discipline_service)
):
    return service.create(data.name, data.code)


@router.get("", response_model=list[DisciplineResponse])
def list_disciplines(
    current_user=Depends(get_current_user),
    service: DisciplineService = Depends(get_discipline_service)
):
    return service.list()


@router.get("/{public_id}", response_model=DisciplineResponse)
def get_discipline(
    public_id: str,
    current_user=Depends(get_current_user),
    service: DisciplineService = Depends(get_discipline_service)
):
    try:
        return service.get_by_public_id(public_id)
    except DisciplinaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.put("/{public_id}", response_model=DisciplineResponse)
def update_discipline(
    public_id: str,
    data: DisciplineUpdateRequest,
    admin=Depends(require_admin),
    service: DisciplineService = Depends(get_discipline_service)
):
    try:
        return service.update(public_id, data.name, data.code)
    except DisciplinaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.delete("/{public_id}", status_code=204)
def delete_discipline(
    public_id: str,
    admin=Depends(require_admin),
    service: DisciplineService = Depends(get_discipline_service)
):
    try:
        service.delete(public_id)
    except DisciplinaNaoEncontradaError as error:
        raise HTTPException(status_code=404, detail=str(error))